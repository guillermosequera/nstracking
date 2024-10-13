import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import { sheetIds } from '@/config/roles';

const getGCPCredentials = () => {
  return {
    client_email: process.env.GCP_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GCP_PRIVATE_KEY.replace(/\\n/g, '\n'),
  };
};

const getAuthClient = () => {
  const credentials = getGCPCredentials();
  return new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sheet = searchParams.get('sheet');
  
  if (!sheet || !sheetIds[sheet]) {
    return NextResponse.json({ error: 'Invalid sheet parameter' }, { status: 400 });
  }

  const sheetId = sheetIds[sheet];

  try {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A:Z',  // Adjust this range as needed
    });

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      return NextResponse.json([]);
    }

    // Assume the first row contains headers
    const headers = rows[0];
    const data = rows.slice(1).map(row => {
      let obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}