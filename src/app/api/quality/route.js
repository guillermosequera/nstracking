import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { sheetIds } from '@/config/roles';
import { getGCPCredentials, getAuthClient } from '@/utils/googleAuth';


export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const sheet = searchParams.get('sheet');
    const timeFrame = searchParams.get('timeFrame');
  
    let sheetId;
    switch (sheet) {
      case 'quality':
        sheetId = sheetIds.workerQuality;
        break;
      case 'merma':
        sheetId = sheetIds.merma;
        break;
      case 'garantia':
        sheetId = sheetIds.garantia;
        break;
      default:
        return NextResponse.json({ error: 'Invalid sheet' }, { status: 400 });
    }

    try {
        const auth = getAuthClient();
        const sheets = google.sheets({ version: 'v4', auth });
    
        const response = await sheets.spreadsheets.values.get({
          spreadsheetId: sheetId,
          range: 'A:F', // Ajusta esto según tu estructura de hoja
        });
    
        const rows = response.data.values;


        return NextResponse.json(rows);
  } catch (error) {
    console.error('Error fetching quality sheet data:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}


export async function POST(request) {
    console.log('Iniciando solicitud POST para Control de Calidad');
    const body = await request.json();
    console.log('Datos recibidos:', body);
    const { jobNumber, timestamp, userEmail, controlType, result, notes, targetSheet, status } = body;

  // Determinar el ID de la hoja de destino
  let sheetId;
  switch (targetSheet) {
    case 'merma':
      sheetId = sheetIds.merma;
      break;
    case 'garantia':
      sheetId = sheetIds.garantia;
      break;
    case 'quality':
      sheetId = sheetIds.workerQuality;
      break;
    default:
      console.error(`Sheet ID no encontrado para: ${targetSheet}`);
      return NextResponse.json({ error: `Invalid target sheet: ${targetSheet}` }, { status: 400 });
  }

  const statusSheetId = sheetIds.status;

  if (!sheetId) {
    console.error(`Sheet ID no encontrado para: ${targetSheet}`);
    return NextResponse.json({ error: 'Invalid target sheet' }, { status: 400 });
  }

  try {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const values = [[jobNumber, timestamp, userEmail, controlType, result, notes]];
    const statusValues = [[jobNumber, timestamp, 'quality', status, userEmail, controlType, result, notes]];

    // Agregar a la hoja correspondiente (calidad, merma o garantía)
    console.log(`Intentando añadir datos a la hoja de ${targetSheet}:`, values);
    const sheetResponse = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });

    // Agregar a la hoja de estado
    console.log('Intentando añadir datos a la hoja de estado:', statusValues);
    const statusResponse = await sheets.spreadsheets.values.append({
      spreadsheetId: statusSheetId,
      range: 'A:H',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: statusValues },
    });

    console.log(`Respuesta de append (${targetSheet}):`, JSON.stringify(sheetResponse.data, null, 2));
    console.log('Respuesta de append (estado):', JSON.stringify(statusResponse.data, null, 2));

    return NextResponse.json({ 
      newJob: { jobNumber, timestamp, userEmail, status, controlType, result, notes },
      message: `Job added successfully to ${targetSheet} and status sheets`
    });
  } catch (error) {
    console.error('Error en POST /api/quality:', error);
    console.error('Stack trace:', error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}