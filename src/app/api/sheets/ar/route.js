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
    console.log('Iniciando solicitud POST para WorkerLabsAR');
    const body = await request.json();
    console.log('Datos recibidos:', body);
  
    const { jobNumber, timestamp, crystalType, userEmail, role, activePage, status } = body;
    const sheetId = sheetIds[role];
    const statusSheetId = sheetIds['status'];
  
    if (!sheetId) {
      console.error(`Sheet ID no encontrado para el rol: ${role}`);
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }
  
    try {
      const auth = getAuthClient();
      const sheets = google.sheets({ version: 'v4', auth });
  
      const values = [[jobNumber, timestamp, crystalType, userEmail]];
      const correctStatus = getStatusFromPage(activePage);
      const statusValues = [[jobNumber, timestamp, activePage, correctStatus, userEmail, crystalType]];
  
      // Agregar a la hoja del área
      console.log('Intentando añadir datos a la hoja del área:', values);
      const areaResponse = await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: 'A:D',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values },
      });
  
      // Agregar a la hoja de estado
      console.log('Intentando añadir datos a la hoja de estado:', statusValues);
      const statusResponse = await sheets.spreadsheets.values.append({
        spreadsheetId: statusSheetId,
        range: 'A:F',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: statusValues },
      });
  
      console.log('Respuesta de append (área):', JSON.stringify(areaResponse.data, null, 2));
      console.log('Respuesta de append (estado):', JSON.stringify(statusResponse.data, null, 2));
  
      return NextResponse.json({ 
        newJob: { jobNumber, timestamp, crystalType, userEmail, status: correctStatus },
        message: 'AR job added successfully to both sheets'
      });
    } catch (error) {
      console.error('Error en POST /api/sheets/ar:', error);
      console.error('Stack trace:', error.stack);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }