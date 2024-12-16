// src/app/api/fetchAllSheetData.js

import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getAuthClient } from '@/utils/googleAuth';
import { sheetIds } from '@/config/roles';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const sheet = searchParams.get('sheet');

  if (!sheet || !sheetIds[sheet]) {
    return NextResponse.json({ error: 'Invalid or missing sheet parameter' }, { status: 400 });
  }

  try {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const sheetId = sheetIds[sheet];

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: 'A:Z',
    });

    const data = response.data.values || [];

    return NextResponse.json({ [sheet]: data });
  } catch (error) {
    console.error('Error in fetchSheetData:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}