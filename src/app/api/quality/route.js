import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { sheetIds } from '@/config/roles';
import { getAuthClient } from '@/utils/googleAuth';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const sheet = searchParams.get('sheet');

    if (!sheet) {
        return NextResponse.json({ error: 'Sheet parameter is required' }, { status: 400 });
    }

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
            return NextResponse.json({ error: 'Invalid sheet type' }, { status: 400 });
    }

    try {
        const auth = getAuthClient();
        const sheets = google.sheets({ version: 'v4', auth });
    
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: 'A:G',
        });
    
        const rows = response.data.values || [];
        return NextResponse.json(rows);
    } catch (error) {
        console.error('Error fetching quality data:', error);
        return NextResponse.json(
            { error: error.message || 'Error interno del servidor' }, 
            { status: 500 }
        );
    }
}

export async function POST(request) {
    console.log('Iniciando solicitud POST para Control de Calidad');
    const body = await request.json();
    console.log('Datos recibidos:', body);

    const { 
        jobNumber, 
        status,
        userEmail,
        notes = ''
    } = body;

    const timestamp = new Date().toISOString();
    const qualitySheetId = sheetIds.workerQuality;
    const statusSheetId = sheetIds.status;

    try {
        const auth = getAuthClient();
        const sheets = google.sheets({ version: 'v4', auth });

        // Valores para ambas hojas
        const qualityValues = [[
            jobNumber,
            timestamp,
            userEmail,
            status,
            notes
        ]];

        const statusValues = [[
            jobNumber,
            timestamp,
            'quality',
            status,
            userEmail,
            notes
        ]];

        // Agregar a la hoja de calidad
        await sheets.spreadsheets.values.append({
            spreadsheetId: qualitySheetId,
            range: 'A:E',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: qualityValues },
        });

        // Agregar a la hoja de status
        await sheets.spreadsheets.values.append({
            spreadsheetId: statusSheetId,
            range: 'A:F',
            valueInputOption: 'USER_ENTERED',
            requestBody: { values: statusValues },
        });

        return NextResponse.json({ 
            newJob: { 
                jobNumber, 
                timestamp, 
                status, 
                userEmail,
                notes 
            },
            message: 'Quality job added successfully to both sheets'
        });
    } catch (error) {
        console.error('Error en POST /api/quality:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    console.log('Iniciando solicitud DELETE para Control de Calidad');
    const { searchParams } = new URL(request.url);
    const jobNumber = searchParams.get('jobNumber');
    const timestamp = searchParams.get('timestamp');

    if (!jobNumber) {
        return NextResponse.json({ error: 'Job number is required' }, { status: 400 });
    }

    try {
        const auth = getAuthClient();
        const sheets = google.sheets({ version: 'v4', auth });

        // 1. Eliminar de la hoja de calidad
        const qualityRowData = await deleteFromSheet(
            sheets, 
            sheetIds.workerQuality, 
            jobNumber,
            timestamp
        );

        if (!qualityRowData) {
            throw new Error('No se encontró el trabajo en la hoja de calidad');
        }

        // 2. Eliminar de la hoja status
        await deleteFromSheet(
            sheets, 
            sheetIds.status, 
            jobNumber,
            qualityRowData.timestamp
        );

        return NextResponse.json({ 
            message: 'Trabajo eliminado correctamente',
            deletedJob: qualityRowData
        });

    } catch (error) {
        console.error('Error en DELETE /api/quality:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

async function deleteFromSheet(sheets, spreadsheetId, jobNumber, timestamp) {
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'A:E',
    });

    const rows = response.data.values || [];
    console.log(`Buscando trabajo ${jobNumber} con timestamp ${timestamp}`);

    const rowIndex = rows.findIndex(row => {
        if (!row[0] || !row[1]) return false;
        
        const rowJobNumber = row[0].toString().trim();
        const rowTimestamp = row[1].toString().trim();
        
        return rowJobNumber === jobNumber.toString() && 
               (timestamp ? rowTimestamp === timestamp : true);
    });

    if (rowIndex === -1) {
        console.log(`Trabajo ${jobNumber} no encontrado en la hoja ${spreadsheetId}`);
        return null;
    }

    // Guardar los datos antes de eliminar
    const rowData = {
        jobNumber: rows[rowIndex][0],
        timestamp: rows[rowIndex][1],
        user: rows[rowIndex][2],
        status: rows[rowIndex][3],
        notes: rows[rowIndex][4]
    };

    // Eliminar la fila
    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
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

    return rowData;
}