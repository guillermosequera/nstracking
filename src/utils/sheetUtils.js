import { google } from 'googleapis';
import { getAuthClient } from './googleAuth';
import { sheetIds } from '@/config/roles';

export async function fetchAllSheetData() {
  try {
    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const allData = {};

    for (const [role, sheetId] of Object.entries(sheetIds)) {
      if (sheetId) {
        try {
          const response = await sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: 'A:Z', // Asume que queremos todas las columnas
          });

          allData[role] = response.data.values || [];
        } catch (error) {
          console.error(`Error fetching data for ${role}:`, error);
          allData[role] = [];
        }
      }
    }

    return allData;
  } catch (error) {
    console.error('Error in fetchAllSheetData:', error);
    throw error;
  }
}

export async function fetchSheetAPI(action, sheetId, params = {}) {
  try {
    const response = await fetch('/api/sheets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        sheetId,
        ...params
      }),
    });
    if (!response.ok) {
      throw new Error(`Error en la solicitud: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error en fetchSheetAPI:', error);
    throw error;
  }
}