import { google } from 'googleapis';
import { getAuthClient } from './googleAuth';
import { sheetIds, workerRoles } from '@/config/roles';

// Debug: Mostrar los datos importados
console.log('==== DEBUG: DATOS IMPORTADOS ====');
console.log('sheetIds:', JSON.stringify(sheetIds, null, 2));
console.log('workerRoles:', JSON.stringify(workerRoles, null, 2));
console.log('============================');

// Configuración de hojas a sincronizar basada en workerRoles
export const SHEETS_TO_SYNC = Object.fromEntries(
  workerRoles.map(role => [role, role !== 'workerCommerce']) // Todos true excepto workerCommerce
);

// Debug: Mostrar configuración final
console.log('==== DEBUG: CONFIGURACIÓN FINAL ====');
console.log('SHEETS_TO_SYNC:', JSON.stringify(SHEETS_TO_SYNC, null, 2));
console.log('============================');

// Log de configuración inicial
console.log('Configuración de hojas a sincronizar:', SHEETS_TO_SYNC);
console.log('IDs de hojas disponibles:', sheetIds);
console.log('Roles de trabajadores:', workerRoles);

// Mapeo de columnas para cada tipo de hoja
const SHEET_COLUMNS = {
  worker: {
    jobNumber: 'A',
    timestamp: 'B',
    status: 'C',
    user: 'D'
  },
  status: {
    jobNumber: 'A',
    timestamp: 'B',
    area: 'C',
    status: 'D',
    user: 'E'
  }
};

// Función para obtener datos de una hoja específica
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

// Función para agregar estados faltantes a la hoja de status
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

// Función para obtener el nombre del área a partir del nombre de la hoja
function getAreaName(sheetName) {
  const areaMap = {
    workerWareHouse: 'Bodega',
    workerLabs: 'Laboratorio',
    workerLabsMineral: 'Laboratorio Mineral',
    workerLabsAR: 'Laboratorio AR',
    workerMontage: 'Montaje',
    workerDispatch: 'Despacho',
    workerQuality: 'Control de Calidad',
    workerCommerce: 'Comercial'
  };
  return areaMap[sheetName] || sheetName;
}

// Función principal de sincronización
export async function syncWorkerStatuses() {
  try {
    console.log('\n======= INICIANDO SINCRONIZACIÓN =======');
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });
    
    console.log('\n=== IDs de Hojas ===');
    console.log('Status Sheet ID:', sheetIds.status);
    console.log('WareHouse Sheet ID:', sheetIds.workerWareHouse);
    console.log('Labs Sheet ID:', sheetIds.workerLabs);
    console.log('Labs Mineral Sheet ID:', sheetIds.workerLabsMineral);
    console.log('Labs AR Sheet ID:', sheetIds.workerLabsAR);
    console.log('Montage Sheet ID:', sheetIds.workerMontage);
    console.log('Dispatch Sheet ID:', sheetIds.workerDispatch);
    console.log('Quality Sheet ID:', sheetIds.workerQuality);
    console.log('====================\n');

    const statusSheetId = sheetIds.status;

    console.log('ID de hoja de status:', statusSheetId);

    // Obtener todos los estados actuales de la hoja status
    const statusData = await getSheetData(sheets, statusSheetId, 'A:E');
    const existingStatuses = new Map();

    // Crear un mapa de estados existentes
    statusData.forEach(row => {
      if (!row[0]) return; // Ignorar filas vacías
      const key = `${row[0]}_${row[3]}`; // jobNumber_status como clave única
      existingStatuses.set(key, true);
    });

    const missingEntries = [];

    // Procesar cada hoja worker configurada
    for (const [sheetName, shouldSync] of Object.entries(SHEETS_TO_SYNC)) {
      console.log(`\nProcesando configuración para ${sheetName}:`);
      console.log('- shouldSync:', shouldSync);
      console.log('- ID de hoja:', sheetIds[sheetName]);

      if (!shouldSync) {
        console.log(`Omitiendo hoja ${getAreaName(sheetName)} (desactivada en configuración)`);
        continue;
      }

      const sheetId = sheetIds[sheetName];
      if (!sheetId) {
        console.log(`No se encontró ID para la hoja ${getAreaName(sheetName)}`);
        continue;
      }

      console.log(`Procesando hoja ${getAreaName(sheetName)}...`);
      const workerData = await getSheetData(sheets, sheetId, 'A:D');

      // Procesar cada fila de la hoja worker
      workerData.forEach(row => {
        if (!row[0]) return; // Ignorar filas vacías

        const jobNumber = row[0];
        const timestamp = row[1];
        const status = row[2];
        const user = row[3];
        const statusKey = `${jobNumber}_${status}`;

        // Verificar si este estado ya existe en la hoja status
        if (!existingStatuses.has(statusKey)) {
          missingEntries.push([
            jobNumber,
            timestamp,
            getAreaName(sheetName), // área con nombre amigable
            status,
            user
          ]);
          console.log(`Estado faltante encontrado para trabajo ${jobNumber}: ${status} en ${getAreaName(sheetName)}`);
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

    return {
      success: true,
      syncedEntries: missingEntries.length,
      message: `Sincronización completada. Se agregaron ${missingEntries.length} estados.`
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