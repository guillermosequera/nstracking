import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getStatusFromPage } from '@/utils/jobUtils';
import { sheetIds, getUserWarehouse } from '@/config/roles';
import { getCachedData, setCachedData } from '@/utils/cacheUtils';

const getGCPCredentials = () => {
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
  const { searchParams } = new URL(request.url);
  const warehouse = searchParams.get('warehouse');

  console.log('GET request received for warehouse:', warehouse);

  if (!warehouse) {
    console.error('Warehouse parameter is missing');
    return NextResponse.json({ error: 'Warehouse is required' }, { status: 400 });
  }

  const sheetId = process.env.NEXT_PUBLIC_SHEET_ID_INVENTORY_SHEET;

  if (!sheetId) {
    console.error('Invalid sheet ID for inventory');
    return NextResponse.json({ error: 'Invalid sheet ID for inventory' }, { status: 400 });
  }

  try {
    console.log('Attempting to fetch inventory data');
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A:I',
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log('No data found in the sheet');
      return NextResponse.json([]);
    }

    const headers = rows[0];
    const inventory = rows.slice(1).map(row => {
      let item = {};
      headers.forEach((header, index) => {
        item[header.toLowerCase()] = row[index];
      });
      return item;
    });

    // Filter by warehouse only if it's not 'all'
    const filteredInventory = warehouse === 'all' ? inventory : inventory.filter(item => item.bodega === warehouse);

    console.log(`Fetched ${filteredInventory.length} items for warehouse: ${warehouse}`);
    return NextResponse.json(filteredInventory);
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { action, codprod, desprod, desprod2, unidad, grupo, pieza, warehouse, userEmail } = await request.json();

  console.log('POST request received:', { action, codprod, warehouse, userEmail });

  if (!action || !codprod || !warehouse || !userEmail) {
    console.error('Missing required fields');
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const sheetId = process.env.NEXT_PUBLIC_SHEET_ID_INVENTORY_SHEET;

  if (!sheetId) {
    console.error('Invalid sheet ID for inventory');
    return NextResponse.json({ error: 'Invalid sheet ID for inventory' }, { status: 400 });
  }

  try {
    console.log('Attempting to update inventory');
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Obtener todos los datos de la hoja de cálculo
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A:I',
    });

    const rows = response.data.values;
    console.log('Total rows fetched:', rows.length);

    // Buscar el producto en todas las bodegas
    const productRow = rows.find(row => row[2] === codprod);

    if (action === 'add' && !productRow) {
      // Añadir nuevo producto
      const newRow = [
        new Date().toISOString(), // Timestamp
        warehouse,
        codprod,
        desprod,
        desprod2 || '',
        unidad,
        grupo,
        '',  // Marca (vacío por defecto)
        pieza
      ];

      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetId,
        range: 'A:I',
        valueInputOption: 'USER_ENTERED',
        resource: { values: [newRow] },
      });

      console.log('New product added successfully');
    } else if (action === 'increment' && productRow) {
      // Incrementar cantidad de producto existente
      const currentQuantity = parseInt(productRow[8], 10);
      const newQuantity = currentQuantity + parseInt(pieza, 10);

      const rowIndex = rows.findIndex(row => row === productRow);
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `I${rowIndex + 1}`,
        valueInputOption: 'RAW',
        resource: { values: [[newQuantity]] },
      });

      console.log('Product quantity updated successfully');
    } else {
      console.error('Invalid action or product not found');
      return NextResponse.json({ error: 'Invalid action or product not found' }, { status: 400 });
    }

    // Registrar la acción en la Hoja2
    const timestamp = new Date().toISOString();
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'Hoja 2!A:E',
      valueInputOption: 'USER_ENTERED',
      resource: { values: [[timestamp, codprod, warehouse, userEmail, action]] },
    });

    console.log('Action logged successfully');
    return NextResponse.json({ 
      message: action === 'add' ? 'Product added successfully' : 'Product quantity updated successfully'
    });
  } catch (error) {
    console.error('Error processing inventory action:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}