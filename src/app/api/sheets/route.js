import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { sheetIds } from '@/config/roles';
import { getAuthClient } from '@/utils/googleAuth';
import { getStatusFromPage } from '@/utils/jobUtils';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    
    console.log('Iniciando solicitud GET');
    console.log('Rol recibido:', role);

    if (!role) {
      console.log('Rol no especificado');
      return NextResponse.json({ error: 'Role parameter is required' }, { status: 400 });
    }

    const sheetId = sheetIds[role];
    if (!sheetId) {
      console.error(`Sheet ID no encontrado para rol: ${role}`);
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    console.log('Intentando leer datos de la hoja:', sheetId);

    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A:Z',
    });

    const rows = response.data.values || [];
    console.log(`Total de filas recuperadas: ${rows.length}`);

    return NextResponse.json(rows);

  } catch (error) {
    console.error('Error al obtener datos de la hoja:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  console.log('Iniciando solicitud POST');
  try {
    const body = await request.json();
    const { jobNumber, timestamp, userEmail, role, activePage, status } = body;
    
    const sheetId = sheetIds[role];
    const statusSheetId = sheetIds.status;

    if (!sheetId) {
      console.error(`Sheet ID no encontrado para el rol: ${role}`);
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const values = [[
      jobNumber, 
      timestamp, 
      status || getStatusFromPage(activePage),
      userEmail
    ]];
    
    const statusValues = [[
      jobNumber, 
      timestamp,
      activePage,
      status || getStatusFromPage(activePage),
      userEmail,
      ''
    ]];

    // Agregar a la hoja del área
    console.log('Agregando a hoja del área:', values);
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'A:D', // Actualizado para incluir la columna D
      valueInputOption: 'USER_ENTERED',
      requestBody: { values }
    });

    // Agregar a la hoja de status
    console.log('Agregando a hoja de status:', statusValues);
    await sheets.spreadsheets.values.append({
      spreadsheetId: statusSheetId,
      range: 'A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: statusValues }
    });

    return NextResponse.json({
      success: true,
      newJob: {
        jobNumber,
        timestamp,
        status: status || getStatusFromPage(activePage),
        userEmail
      }
    });

  } catch (error) {
    console.error('Error en POST:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request) {
  try {
    const body = await request.json();
    const { jobNumber, userRole } = body;
    
    console.log('Procesando solicitud de eliminación:', { jobNumber, userRole });

    if (!jobNumber || !userRole) {
      return NextResponse.json({ 
        success: false,
        error: 'Faltan campos requeridos' 
      }, { status: 400 });
    }

    const sheetId = sheetIds[userRole];
    if (!sheetId) {
      return NextResponse.json({ 
        success: false,
        error: 'Rol de usuario inválido' 
      }, { status: 400 });
    }

    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    // Buscar el trabajo primero
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A:A',
    });

    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[0] === jobNumber.toString());

    if (rowIndex === -1) {
      return NextResponse.json({ 
        success: false,
        error: 'Trabajo no encontrado' 
      }, { status: 404 });
    }

    // Eliminar la fila
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      resource: {
        requests: [{
          deleteDimension: {
            range: {
              sheetId: 0,
              dimension: 'ROWS',
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        }],
      },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Trabajo eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error en DELETE /api/sheets:', error);
    return NextResponse.json({ 
      success: false,
      error: error.message || 'Error interno del servidor'
    }, { status: 500 });
  }
}