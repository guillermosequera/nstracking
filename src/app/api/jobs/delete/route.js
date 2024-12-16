import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { JWT } from 'google-auth-library';

export async function POST(request) {
  try {
    const { jobNumber, role, userEmail, timestamp } = await request.json();
    
    console.log('Datos recibidos:', { jobNumber, role, timestamp }); // Para debug
    
    // Mapear el role al formato correcto de la variable de entorno
    const sheetIdMap = {
      workerWareHouse: 'WAREHOUSE',
      workerMontage: 'MONTAGE',
      workerLabs: 'LABS',
      workerDispatch: 'DISPATCH',
      workerQuality: 'QUALITY',
      workerCommerce: 'COMMERCE',
      workerLabsAR: 'LABS_AR',
      workerLabsMineral: 'LABS_MINERAL'
    };
    
    const sheetType = sheetIdMap[role];
    if (!sheetType) {
      throw new Error(`Rol no válido: ${role}`);
    }
    
    // Configurar autenticación
    const auth = new JWT({
      email: process.env.GCP_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GCP_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    // 1. Eliminar de la hoja principal
    const mainSpreadsheetId = process.env[`NEXT_PUBLIC_SHEET_ID_${sheetType}_SHEET`];
    if (!mainSpreadsheetId) {
      throw new Error(`No se encontró ID de hoja para el rol: ${role}`);
    }

    const mainRowData = await deleteFromSheet(sheets, mainSpreadsheetId, jobNumber, timestamp);
    if (!mainRowData) {
      throw new Error('No se encontró el trabajo en la hoja principal');
    }
    
    // 2. Eliminar de la hoja status usando el timestamp del registro principal
    const statusSpreadsheetId = process.env.NEXT_PUBLIC_SHEET_ID_STATUS_SHEET;
    if (!statusSpreadsheetId) {
      throw new Error('No se encontró ID de hoja de status');
    }

    await deleteFromSheet(sheets, statusSpreadsheetId, jobNumber, mainRowData.timestamp);

    // 3. Registrar el cambio en la hoja "CAMBIOS"
    await sheets.spreadsheets.values.append({
      spreadsheetId: mainSpreadsheetId,
      range: 'CAMBIOS!A:D',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      resource: {
        values: [[
          new Date().toISOString(),
          jobNumber,
          'DELETE',
          userEmail
        ]]
      }
    });

    return NextResponse.json({ message: 'Trabajo eliminado correctamente' });
  } catch (error) {
    console.error('Error en delete/route.js:', error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

async function deleteFromSheet(sheets, spreadsheetId, jobNumber, timestamp) {
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'A:D',
  });

  const rows = response.data.values || [];
  console.log(`Buscando trabajo ${jobNumber} con timestamp ${timestamp}`);

  const rowIndex = rows.findIndex(row => {
    if (!row[0] || !row[1]) return false; // Verificar que existan los valores
    
    const rowJobNumber = row[0].toString().trim();
    const rowTimestamp = row[1].toString().trim();
    
    console.log(`Comparando: jobNumber ${rowJobNumber} === ${jobNumber} && timestamp ${rowTimestamp} === ${timestamp}`);
    
    return rowJobNumber === jobNumber.toString() && 
           (timestamp ? rowTimestamp === timestamp : true);
  });

  if (rowIndex === -1) {
    console.log(`Trabajo ${jobNumber} no encontrado en la hoja ${spreadsheetId}`);
    return null;
  }

  // Guardar los datos antes de eliminar
  const rowData = {
    jobNumber: rows[rowIndex][0],
    timestamp: rows[rowIndex][1],
    status: rows[rowIndex][2],
    user: rows[rowIndex][3]
  };

  // Eliminar la fila
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: 0,
            dimension: 'ROWS',
            startIndex: rowIndex,
            endIndex: rowIndex + 1
          }
        }
      }]
    }
  });

  return rowData;
}