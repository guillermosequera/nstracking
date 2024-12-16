import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getAuthClient } from '@/utils/googleAuth';
import { sheetIds } from '@/config/roles';

export async function POST(request) {
  try {
    const { jobNumber, timestamp, userEmail } = await request.json();
    
    console.log('Datos recibidos en commerce/delete:', { jobNumber, timestamp, userEmail });

    const commerceSheetId = sheetIds.workerCommerce;
    const statusSheetId = sheetIds.status;

    if (!commerceSheetId) {
      throw new Error('No se encontró ID de hoja para Commerce');
    }

    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });
    const drive = google.drive({ version: 'v3', auth });

    // 1. Buscar y eliminar de la hoja de Commerce
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: commerceSheetId,
      range: 'A:F', // Incluye todas las columnas de Commerce
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => {
      if (!row[0] || !row[1]) return false;
      return row[0].toString() === jobNumber.toString() && 
             (timestamp ? row[1].toString() === timestamp.toString() : true);
    });

    if (rowIndex === -1) {
      throw new Error('Trabajo no encontrado en la hoja de Commerce');
    }

    // Guardar datos antes de eliminar
    const rowData = {
      jobNumber: rows[rowIndex][0],
      timestamp: rows[rowIndex][1],
      deliveryDate: rows[rowIndex][2],
      lenswareNumber: rows[rowIndex][3],
      file: rows[rowIndex][4],
      user: rows[rowIndex][5]
    };

    // 2. Si hay un archivo, intentar eliminarlo de Drive
    if (rowData.file) {
      try {
        const fileId = extractFileId(rowData.file);
        if (fileId) {
          await drive.files.delete({ fileId });
          console.log('Archivo eliminado de Drive:', fileId);
        }
      } catch (fileError) {
        console.error('Error al eliminar archivo:', fileError);
        // Continuamos con la eliminación del registro aunque falle la eliminación del archivo
      }
    }

    // 3. Eliminar la fila de Commerce
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: commerceSheetId,
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

    // 4. Eliminar de la hoja status
    try {
      const statusResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: statusSheetId,
        range: 'A:D',
      });

      const statusRows = statusResponse.data.values || [];
      const statusRowIndex = statusRows.findIndex(row => {
        if (!row[0] || !row[1]) return false;
        return row[0].toString() === jobNumber.toString() && 
               (rowData.timestamp ? row[1].toString() === rowData.timestamp.toString() : true);
      });

      if (statusRowIndex !== -1) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId: statusSheetId,
          requestBody: {
            requests: [{
              deleteDimension: {
                range: {
                  sheetId: 0,
                  dimension: 'ROWS',
                  startIndex: statusRowIndex,
                  endIndex: statusRowIndex + 1
                }
              }
            }]
          }
        });
        console.log('Eliminado de la hoja status:', jobNumber);
      } else {
        console.log('No se encontró el trabajo en la hoja status:', jobNumber);
      }
    } catch (statusError) {
      console.error('Error al eliminar de status:', statusError);
      // No lanzamos el error para que no afecte la operación principal
    }

    // 5. Registrar el cambio en la hoja "CAMBIOS"
    await sheets.spreadsheets.values.append({
      spreadsheetId: commerceSheetId,
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

    return NextResponse.json({ 
      message: 'Trabajo eliminado correctamente',
      deletedJob: rowData 
    });

  } catch (error) {
    console.error('Error en commerce/delete:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

function extractFileId(fileUrl) {
  if (!fileUrl) return null;
  const match = fileUrl.match(/[-\w]{25,}/);
  return match ? match[0] : null;
} 