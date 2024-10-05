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