import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { sheetIds } from '@/config/roles';
import { getStatusFromPage } from '@/utils/jobUtils';
import { getCachedData, setCachedData } from '@/utils/cacheUtils';

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

export async function GET(request) {
  console.log('Iniciando solicitud GET');
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const timeFrame = searchParams.get('timeFrame');
  const jobNumber = searchParams.get('jobNumber');
  const sheetId = sheetIds[role];

  console.log(`Parámetros de la solicitud: role=${role}, timeFrame=${timeFrame}, jobNumber=${jobNumber}, sheetId=${sheetId}`);

  if (!role) {
    console.error('Rol no especificado');
    return NextResponse.json({ error: 'Role is required' }, { status: 400 });
  }

  if (!sheetId) {
    console.error(`Sheet ID no encontrado para el rol: ${role}`);
    return NextResponse.json({ error: `Invalid role ${role}` }, { status: 400 });
  }

  try {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    if (role === 'status' && jobNumber) {
      return await getJobStatus(sheets, sheetId, jobNumber);
    }

    console.log(`Intentando leer datos de la hoja: ${sheetId}`);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A:E',
    });

    console.log('Respuesta recibida de Google Sheets');
    console.log('Metadata de la respuesta:', JSON.stringify(response.data, null, 2));

    const allValues = response.data.values || [];
    console.log(`Total de filas recuperadas: ${allValues.length}`);

    if (allValues.length === 0) {
      console.warn('No se encontraron datos en la hoja de cálculo');
      return NextResponse.json([]);
    }

    console.log('Filtrando datos por timeFrame');
    const filteredValues = filterDataByTimeFrame(allValues, timeFrame);
    console.log(`Total de filas después del filtrado: ${filteredValues.length}`);

    return NextResponse.json(filteredValues);
  } catch (error) {
    console.error('Error en GET /api/sheets:', error);
    console.error('Stack trace:', error.stack);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

async function getJobStatus(sheets, sheetId, jobNumber) {
  console.log(`Buscando estado del trabajo: ${jobNumber}`);
  
  // Intentar obtener datos del caché
  const cachedData = getCachedData(`jobStatus_${jobNumber}`);
  if (cachedData) {
    console.log(`Datos obtenidos del caché para el trabajo: ${jobNumber}`);
    return NextResponse.json(cachedData);
  }

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'A:E',
  });

  const allValues = response.data.values || [];
  const jobHistory = allValues.filter(row => row[0] === jobNumber);

  if (jobHistory.length === 0) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  }

  // Guardar en caché para futuras consultas
  setCachedData(`jobStatus_${jobNumber}`, jobHistory);

  return NextResponse.json(jobHistory);
}

export async function POST(request) {
  console.log('Iniciando solicitud POST');
  const body = await request.json();
  const { jobNumber, timestamp, userEmail, role, activePage, status } = body;
  const sheetId = sheetIds[role];
  const statusSheetId = sheetIds['status'];

  if (!sheetId) {
    console.error(`Sheet ID no encontrado para el rol: ${role}`);
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  try {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const values = [[jobNumber, timestamp, userEmail]];
    const correctStatus = getStatusFromPage(activePage);
    const statusValues = [[jobNumber, timestamp, activePage, correctStatus, userEmail]];

    // Agregar a la hoja del área
    console.log('Intentando añadir datos a la hoja del área:', values);
    const areaResponse = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'A:C',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });

    // Agregar a la hoja de estado
    console.log('Intentando añadir datos a la hoja de estado:', statusValues);
    const statusResponse = await sheets.spreadsheets.values.append({
      spreadsheetId: statusSheetId,
      range: 'A:E',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: statusValues },
    });

    console.log('Respuesta de append (área):', JSON.stringify(areaResponse.data, null, 2));
    console.log('Respuesta de append (estado):', JSON.stringify(statusResponse.data, null, 2));

    return NextResponse.json({ 
      newJob: { jobNumber, timestamp, userEmail, status: correctStatus },
      message: 'Job added successfully to both sheets'
    });
  } catch (error) {
    console.error('Error en POST /api/sheets:', error);
    console.error('Stack trace:', error.stack);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function buildQuery(timeFrame) {
  console.log(`Construyendo query para timeFrame: ${timeFrame}`);
  const now = new Date();
  let startDate, endDate;

  switch (timeFrame) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      endDate = new Date(now.setHours(23, 59, 59, 999));
      break;
    case 'yesterday':
      startDate = new Date(now.setDate(now.getDate() - 1));
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'twoDaysAgo':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 2);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setDate(now.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'week':
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case 'lastMonth':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    default:
      console.log('TimeFrame no válido, retornando null');
      return { startDate: null, endDate: null };
  }

  console.log(`Query construida: startDate=${startDate.toISOString()}, endDate=${endDate.toISOString()}`);
  return { startDate, endDate };
}

function filterDataByTimeFrame(data, timeFrame) {
  console.log(`Filtrando datos para timeFrame: ${timeFrame}`);
  const { startDate, endDate } = buildQuery(timeFrame);
  
  if (!startDate || !endDate) {
    console.log('No hay fechas válidas para filtrar, retornando todos los datos');
    return data;
  }

  console.log(`Filtrando datos entre ${startDate.toISOString()} y ${endDate.toISOString()}`);
  const filteredData = data.filter((row, index) => {
    if (index === 0) return false; // Skip header row
    const rowDate = new Date(row[1]);
    return rowDate >= startDate && rowDate <= endDate;
  });

  console.log(`Datos filtrados: ${filteredData.length} filas`);
  return filteredData;
}