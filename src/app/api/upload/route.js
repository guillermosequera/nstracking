import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { getAuthClient } from '@/utils/googleAuth';

export async function POST(request) {
  const formData = await request.formData();
  const file = formData.get('file');
  const jobNumber = formData.get('jobNumber');

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  try {
    const auth = await getAuthClient();
    const drive = google.drive({ version: 'v3', auth });

    const fileMetadata = {
      name: file.name,
      parents: ['Y1sG8FmzvAE0zrQ4-joeKOsX05Klsu_3gP'], // Reemplaza con el ID de la carpeta en Google Drive
    };

    const media = {
      mimeType: file.type,
      body: file.stream(),
    };

    const driveResponse = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
    });

    const fileId = driveResponse.data.id;
    const fileLink = driveResponse.data.webViewLink;

    // Actualizar la hoja de cálculo con el enlace del archivo
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

    return NextResponse.json({ fileId, fileLink });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Error uploading file' }, { status: 500 });
  }
}