import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { sheetIds } from '@/config/roles';
import { getAuthClient } from '@/utils/googleAuth';

export async function POST(request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'delete') {
    try {
      const data = await request.json();
      const { jobNumber, timestamp } = data;
      
      if (!jobNumber || !timestamp) {
        throw new Error('Se requiere número de trabajo y timestamp');
      }

      const auth = getAuthClient();
      const sheets = google.sheets({ version: 'v4', auth });

      // Buscar en la hoja de status primero
      const statusResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetIds.status,
        range: 'A:H',
      });

      const statusRows = statusResponse.data.values || [];
      const statusIndex = statusRows.findIndex(row => 
        row[0] === jobNumber && row[1] === timestamp && row[2] === 'despacho'
      );

      // Buscar en la hoja de despacho
      const dispatchResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: sheetIds.workerDispatch,
        range: 'A:I',
      });

      const dispatchRows = dispatchResponse.data.values || [];
      const dispatchIndex = dispatchRows.findIndex(row => 
        row[0] === jobNumber && row[1] === timestamp
      );

      if (dispatchIndex === -1) {
        throw new Error('Trabajo no encontrado en la hoja de despacho');
      }

      // Eliminar de ambas hojas solo si las fechas coinciden
      await sheets.spreadsheets.values.clear({
        spreadsheetId: sheetIds.workerDispatch,
        range: `A${dispatchIndex + 1}:I${dispatchIndex + 1}`,
      });

      if (statusIndex !== -1) {
        await sheets.spreadsheets.values.clear({
          spreadsheetId: sheetIds.status,
          range: `A${statusIndex + 1}:H${statusIndex + 1}`,
        });
      }

      return NextResponse.json({ success: true });

    } catch (error) {
      console.error('Error eliminando trabajo:', error);
      return NextResponse.json(
        { error: error.message || 'Error interno del servidor' },
        { status: 500 }
      );
    }
  } else {
    // Lógica existente para agregar trabajos
    try {
      const data = await request.json();
      const auth = getAuthClient();
      const sheets = google.sheets({ version: 'v4', auth });
      
      // Validar datos requeridos
      if (!data.jobNumber) {
        throw new Error('Número de trabajo es requerido');
      }

      // Determinar el estado según si hay empresa seleccionada
      const status = data.company && data.company !== 'Sin Asignar' 
        ? 'Despachado' 
        : 'En despacho';

      // Preparar los datos para la hoja de despacho
      const dispatchValues = [[
        data.jobNumber,
        data.timestamp || new Date().toISOString(),
        data.company || 'Sin Asignar',
        data.client || '',
        data.invoiceNumber || '',
        data.shippingCompany || '',
        data.shippingOrder || '',
        data.userEmail,
        status
      ]];

      // Preparar los datos para la hoja de status
      const statusValues = [[
        data.jobNumber,
        data.timestamp || new Date().toISOString(),
        'despacho',
        status,
        data.userEmail,
        data.invoiceNumber,
        data.shippingCompany,
        data.shippingOrder,
      ]];

      // Agregar a la hoja de despacho
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetIds.workerDispatch,
        range: 'A:I',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: dispatchValues,
        },
      });

      // Agregar a la hoja de status
      await sheets.spreadsheets.values.append({
        spreadsheetId: sheetIds.status,
        range: 'A:D',
        valueInputOption: 'USER_ENTERED',
        insertDataOption: 'INSERT_ROWS',
        requestBody: {
          values: statusValues,
        },
      });

      return NextResponse.json({ success: true });

    } catch (error) {
      console.error('Error al agregar trabajo:', error);
      return NextResponse.json(
        { error: error.message || 'Error interno del servidor' },
        { status: 500 }
      );
    }
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyFilter = searchParams.get('companyFilter');
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetIds.workerDispatch,
      range: 'A:I',
    });

    let rows = response.data.values || [];

    // Si hay un filtro de empresa y no es undefined/null/objeto
    if (companyFilter && typeof companyFilter === 'string') {
      if (companyFilter === '') {
        rows = rows.filter(row => row[2] === 'Sin Asignar');
      } else {
        rows = rows.filter(row => row[2] === companyFilter);
      }
    }

    console.log(`Fetched ${rows.length} jobs for company: ${companyFilter}`);
    return NextResponse.json(rows);

  } catch (error) {
    console.error('Error fetching dispatch data:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobNumber = searchParams.get('jobNumber');
    const timestamp = searchParams.get('timestamp');

    if (!jobNumber || !timestamp) {
      throw new Error('Se requiere número de trabajo y timestamp');
    }

    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Buscar en la hoja de despacho
    const dispatchResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetIds.workerDispatch,
      range: 'A:I',
    });

    // Buscar en la hoja de status
    const statusResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetIds.status,
      range: 'A:H',
    });

    const dispatchRows = dispatchResponse.data.values || [];
    const statusRows = statusResponse.data.values || [];

    // Encontrar índices coincidentes en ambas hojas
    const dispatchIndex = dispatchRows.findIndex(row => 
      row[0] === jobNumber && row[1] === timestamp
    );

    const statusIndex = statusRows.findIndex(row => 
      row[0] === jobNumber && row[1] === timestamp
    );

    if (dispatchIndex === -1) {
      throw new Error('Trabajo no encontrado en la hoja de despacho');
    }

    // Eliminar de la hoja de despacho
    await sheets.spreadsheets.values.clear({
      spreadsheetId: sheetIds.workerDispatch,
      range: `A${dispatchIndex + 1}:I${dispatchIndex + 1}`,
    });

    // Si existe en la hoja de status, eliminar también
    if (statusIndex !== -1) {
      await sheets.spreadsheets.values.clear({
        spreadsheetId: sheetIds.status,
        range: `A${statusIndex + 1}:H${statusIndex + 1}`,
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error eliminando trabajo:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}