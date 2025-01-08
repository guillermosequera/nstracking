import { google } from 'googleapis';
import { getAuthClient } from '@/utils/googleAuth';
import { sheetIds } from '@/config/roles';

export async function POST(request) {
  try {
    const logEntry = await request.json();
    
    // Usar la configuración existente de Google Auth
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Verificar que existe la hoja de logs
    const spreadsheetId = sheetIds.transactionLogs;
    if (!spreadsheetId) {
      console.error('ID de hoja de logs no configurado');
      return Response.json(
        { error: 'ID de hoja de logs no configurado' },
        { status: 500 }
      );
    }

    // Preparar los valores para la hoja
    const values = [
      [
        logEntry.transactionId,
        logEntry.timestamp,
        logEntry.operation,
        logEntry.status,
        logEntry.jobNumber,
        logEntry.details,
        logEntry.user,
        logEntry.sheetAffected
      ]
    ];

    console.log('Intentando escribir en la hoja:', spreadsheetId);
    console.log('Valores a escribir:', values);

    // Añadir el registro a la hoja de logs
    const result = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'Logs!A:H',
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values
      }
    });

    console.log('Resultado de la escritura:', result.data);

    return Response.json({ 
      success: true,
      data: result.data
    });
  } catch (error) {
    console.error('Error en POST /api/logs:', error);
    return Response.json(
      { 
        error: 'Error al registrar el log',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 