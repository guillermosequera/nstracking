import { google } from 'googleapis';
import { getAuthClient } from '@/utils/googleAuth';
import { sheetIds } from '@/config/roles';

// Configuración de hojas a sincronizar
export const SHEETS_TO_SYNC = {
  warehouse: true,
  labs: true,
  labsMineral: true,
  montage: true,
  dispatch: true,
  commerce: false,
  quality: true
};

// Función para obtener el nombre del área a partir del nombre de la hoja
function getAreaName(sheetName) {
  const areaMap = {
    warehouse: 'Bodega',
    labs: 'Laboratorio',
    labsMineral: 'Laboratorio Mineral',
    labsAR: 'Laboratorio AR',
    montage: 'Montaje',
    dispatch: 'Despacho',
    quality: 'Control de Calidad',
    commerce: 'Comercial'
  };
  return areaMap[sheetName] || sheetName;
}

async function getSheetData(sheets, sheetId, range) {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: range
    });
    return response.data.values || [];
  } catch (error) {
    console.error(`Error obteniendo datos de la hoja ${sheetId}:`, error);
    return [];
  }
}

async function addMissingStatuses(sheets, statusSheetId, missingEntries) {
  try {
    if (missingEntries.length === 0) return;

    await sheets.spreadsheets.values.append({
      spreadsheetId: statusSheetId,
      range: 'A:E',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: missingEntries
      }
    });

    console.log(`Se agregaron ${missingEntries.length} estados faltantes a la hoja status`);
  } catch (error) {
    console.error('Error agregando estados faltantes:', error);
  }
}

async function getLastSyncTime(sheets) {
  try {
    // Obtener el último registro de sincronización de la hoja de logs
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetIds.transactionLogs,
      range: 'A:D',  // ID, Timestamp, Action, User
      valueRenderOption: 'FORMATTED_VALUE'
    });

    const rows = response.data.values || [];
    // Filtrar solo los registros de sincronización y ordenar por fecha descendente
    const syncLogs = rows
      .filter(row => row[2] === 'SYNC_PRODUCTION')
      .sort((a, b) => new Date(b[1]) - new Date(a[1]));

    if (syncLogs.length > 0) {
      return new Date(syncLogs[0][1]); // Retorna la fecha del último registro
    }
    return null;
  } catch (error) {
    console.error('Error al obtener última sincronización:', error);
    return null;
  }
}

async function logSyncAction(sheets, timestamp, user = 'system') {
  try {
    const values = [[
      Date.now().toString(), // ID único basado en timestamp
      timestamp,             // Timestamp de la sincronización
      'SYNC_PRODUCTION',     // Acción
      user                   // Usuario que realizó la sincronización
    ]];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetIds.transactionLogs,
      range: 'A:D',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: { values }
    });

    console.log('Registro de sincronización guardado');
  } catch (error) {
    console.error('Error al registrar sincronización:', error);
  }
}

export async function syncWorkerStatuses(userEmail) {
  try {
    console.log('Iniciando sincronización de estados...');
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });
    const statusSheetId = sheetIds.status;

    // Obtener la última fecha de sincronización desde los logs
    const lastSyncTime = await getLastSyncTime(sheets);
    console.log('Última sincronización:', lastSyncTime ? lastSyncTime.toISOString() : 'Primera sincronización');

    // Obtener todos los estados actuales de la hoja status
    const statusData = await getSheetData(sheets, statusSheetId, 'A:E');
    const existingStatuses = new Map();

    // Crear un mapa de estados existentes con clave más específica
    statusData.forEach(row => {
      if (!row[0]) return; // Ignorar filas vacías
      const [jobNumber, timestamp, area, status, user] = row;
      const statusKey = `${jobNumber}_${timestamp}_${area}_${status}`;
      existingStatuses.set(statusKey, {
        jobNumber,
        timestamp,
        area,
        status,
        user
      });
    });

    const missingEntries = [];

    // Procesar cada hoja worker configurada
    for (const [sheetName, shouldSync] of Object.entries(SHEETS_TO_SYNC)) {
      if (!shouldSync) {
        console.log(`Omitiendo hoja ${sheetName} (desactivada en configuración)`);
        continue;
      }

      const sheetId = sheetIds[sheetName];
      if (!sheetId) {
        console.log(`No se encontró ID para la hoja ${sheetName}`);
        continue;
      }

      console.log(`Procesando hoja ${sheetName}...`);
      const workerData = await getSheetData(sheets, sheetId, 'A:D');

      // Procesar cada fila de la hoja worker
      workerData.forEach(row => {
        if (!row[0]) return; // Ignorar filas vacías

        const [jobNumber, timestamp, status, user] = row;
        
        // Si hay última sincronización, solo procesar registros más recientes
        if (lastSyncTime) {
          const rowTime = new Date(timestamp);
          if (rowTime <= lastSyncTime) {
            return; // Ignorar registros anteriores a la última sincronización
          }
        }

        let transformedStatus = status;

        // Transformar estados si la hoja es de despacho
        if (sheetName === 'dispatch') {
          if (status === 'Italoptic' || status === 'Trento') {
            transformedStatus = 'Despachado';
          } else if (status === 'Sin Asignar') {
            transformedStatus = 'En despacho';
          }
        }

        const areaName = getAreaName(sheetName);
        const statusKey = `${jobNumber}_${timestamp}_${areaName}_${transformedStatus}`;

        // Verificar si este estado ya existe en la hoja status
        if (!existingStatuses.has(statusKey)) {
          missingEntries.push([
            jobNumber,
            timestamp,
            areaName,
            transformedStatus,
            user
          ]);
          console.log(`Estado faltante encontrado para trabajo ${jobNumber}: ${transformedStatus} en ${areaName}`);
        }
      });
    }

    // Agregar los estados faltantes a la hoja status
    if (missingEntries.length > 0) {
      console.log(`Se encontraron ${missingEntries.length} estados faltantes para sincronizar`);
      await addMissingStatuses(sheets, statusSheetId, missingEntries);
    } else {
      console.log('No se encontraron estados faltantes para sincronizar');
    }

    // Registrar la sincronización en los logs
    const newSyncTime = new Date().toISOString();
    await logSyncAction(sheets, newSyncTime, userEmail);

    return {
      success: true,
      syncedEntries: missingEntries.length,
      message: `Sincronización completada. Se agregaron ${missingEntries.length} estados.`,
      lastSync: newSyncTime
    };

  } catch (error) {
    console.error('Error en la sincronización:', error);
    return {
      success: false,
      syncedEntries: 0,
      message: `Error en la sincronización: ${error.message}`
    };
  }
} 