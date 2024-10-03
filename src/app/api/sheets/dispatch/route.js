import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { sheetIds } from '@/config/roles';
import { getStatusFromPage } from '@/utils/jobUtils';

const getGCPCredentials = () => {
  console.log('Obteniendo credenciales GCP');
  if (!process.env.GCP_PRIVATE_KEY || !process.env.GCP_SERVICE_ACCOUNT_EMAIL || !process.env.GCP_PROJECT_ID) {
    console.error('Faltan variables de entorno para las credenciales GCP');
    return null;
  }
  return {
    credentials: {
      client_email: process.env.GCP_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GCP_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    projectId: process.env.GCP_PROJECT_ID,
  };
};

const getAuthClient = () => {
  const credentials = getGCPCredentials();
  if (!credentials) {
    throw new Error('No se pudieron obtener las credenciales GCP');
  }
  return new google.auth.GoogleAuth({
    ...credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
};

export async function POST(request) {
  console.log('Iniciando solicitud POST para WorkerDispatch');
  const body = await request.json();
  console.log('Datos recibidos:', body);

  const { jobNumber, timestamp, company, userEmail, agreement, client, invoiceNumber, shippingCompany, shippingOrder } = body;
  const role = 'workerDispatch';
  const page = 'dispatch';
  const sheetId = sheetIds[role];
  const statusSheetId = sheetIds['status'];

  if (!sheetId) {
    console.error(`Sheet ID no encontrado para el rol: ${role}`);
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  try {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    let values;
    let statusValues;

    const status = getStatusFromPage(page);

    if (company === 'trento') {
      values = [[jobNumber, timestamp, company, agreement, '', '', '', userEmail]];
      statusValues = [[jobNumber, timestamp, page, status, userEmail, company, agreement]];
    } else {
      values = [[jobNumber, timestamp, company, client, invoiceNumber, shippingCompany, shippingOrder, userEmail]];
      statusValues = [[jobNumber, timestamp, page, status, userEmail, client, invoiceNumber, shippingCompany, shippingOrder]];
    }

    // Agregar a la hoja del área
    console.log('Intentando añadir datos a la hoja del área:', values);
    const areaResponse = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'A:H',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });

    // Agregar a la hoja de estado
    console.log('Intentando añadir datos a la hoja de estado:', statusValues);
    const statusResponse = await sheets.spreadsheets.values.append({
      spreadsheetId: statusSheetId,
      range: 'A:J',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: statusValues },
    });

    console.log('Respuesta de append (área):', JSON.stringify(areaResponse.data, null, 2));
    console.log('Respuesta de append (estado):', JSON.stringify(statusResponse.data, null, 2));

    return NextResponse.json({ 
      newJob: body,
      message: 'Job added successfully to both sheets'
    });
  } catch (error) {
    console.error('Error en POST /api/sheets/dispatch:', error);
    console.error('Stack trace:', error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}