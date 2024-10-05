import { google } from 'googleapis';
import { getAuthClient } from '@/utils/googleAuth';
import { sheetIds } from '@/config/roles';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const auth = await getAuthClient();
      const sheets = google.sheets({ version: 'v4', auth });

      const allData = {};

      for (const [role, sheetId] of Object.entries(sheetIds)) {
        if (sheetId) {
          try {
            const response = await sheets.spreadsheets.values.get({
              spreadsheetId: sheetId,
              range: 'A:Z',
            });

            allData[role] = response.data.values || [];
          } catch (error) {
            console.error(`Error fetching data for ${role}:`, error);
            allData[role] = [];
          }
        }
      }

      res.status(200).json(allData);
    } catch (error) {
      console.error('Error in fetchAllSheetData:', error);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}