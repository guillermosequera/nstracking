import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getAuthClient } from '@/utils/googleAuth';

export async function POST(request) {
  console.log('Iniciando solicitud POST para carga de archivo');
  const formData = await request.formData();
  const file = formData.get('file');
  const jobNumber = formData.get('jobNumber');

  if (!file) {
    console.log('No se recibió ningún archivo');
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  try {
    console.log('Obteniendo cliente de autenticación');
    const auth = await getAuthClient();
    console.log('Cliente de autenticación obtenido');
    const drive = google.drive({ version: 'v3', auth });

    const fileMetadata = {
      name: file.name,
      parents: [process.env.GOOGLE_DRIVE_FOLDER_ID],
    };

    const media = {
      mimeType: file.type,
      body: file.stream(),
    };

    console.log('Intentando crear archivo en Google Drive');
    const driveResponse = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    console.log('Archivo creado en Google Drive:', driveResponse.data);

    const fileId = driveResponse.data.id;
    const fileLink = driveResponse.data.webViewLink;

    // Actualizar la hoja de cálculo con el enlace del archivo
    console.log('Actualizando hoja de cálculo');
    const sheets = google.sheets({ version: 'v4', auth });
    const sheetId = process.env.NEXT_PUBLIC_SHEET_ID_COMMERCE_SHEET;

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'A:F',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [[jobNumber, new Date().toISOString(), '', '', fileLink]],
      },
    });

    console.log('Hoja de cálculo actualizada');
    return NextResponse.json({ fileId, fileLink });
  } catch (error) {
    console.error('Error al cargar el archivo:', error);
    return NextResponse.json({ error: 'Error uploading file', details: error.message }, { status: 500 });
  }
}