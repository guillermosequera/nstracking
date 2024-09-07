import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { sheetIds } from '@/config/roles';

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const sheetId = sheetIds[role];

  if (!sheetId) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A1:B10',  // Ajusta este rango según tus necesidades
    });

    return NextResponse.json(response.data.values || []);
  } catch (error) {
    console.error('Error in GET /api/sheets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { role, values } = await request.json();
  const sheetId = sheetIds[role];

  if (!sheetId) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'A:B',  // Ajusta este rango según tus necesidades
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [values] },
    });

    return NextResponse.json(response.data);
  } catch (error) {
    console.error('Error in POST /api/sheets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}