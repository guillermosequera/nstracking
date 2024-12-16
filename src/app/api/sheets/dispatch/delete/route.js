import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { sheetIds } from '@/config/roles';
import { getAuthClient } from '@/utils/googleAuth';

export async function POST(request) {
  try {
    const { jobNumber, timestamp, userEmail } = await request.json();
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // 1. Obtener datos actuales de dispatch
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetIds.workerDispatch,
      range: 'A:I',
    });

    const rows = response.data.values || [];
    const normalizedTimestamp = new Date(timestamp).getTime();

    const rowIndex = rows.findIndex(row => {
      if (row[0] !== jobNumber) return false;
      const rowTimestamp = new Date(row[1]).getTime();
      return Math.abs(rowTimestamp - normalizedTimestamp) < 1000;
    });

    if (rowIndex === -1) {
      return NextResponse.json(
        { error: 'Trabajo no encontrado' },
        { status: 404 }
      );
    }

    // 2. Eliminar de la hoja de dispatch
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetIds.workerDispatch,
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

    // 3. Registrar en la hoja de CAMBIOS
    const changesResponse = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetIds.workerDispatch,
      range: 'CAMBIOS!A:D',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: {
        values: [[
          jobNumber,
          new Date().toISOString(),
          'Eliminado de Despacho',
          userEmail
        ]]
      }
    });

    // 4. Eliminar de la hoja STATUS
    const statusResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetIds.status,
      range: 'A:H',
    });

    const statusRows = statusResponse.data.values || [];
    const statusRowIndex = statusRows.findIndex(row => 
      row[0] === jobNumber && row[2] === 'despacho'
    );

    if (statusRowIndex !== -1) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetIds.status,
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
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error al eliminar trabajo:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
} 