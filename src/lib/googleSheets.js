import { google } from 'googleapis';

let sheetsInstance = null;

export async function getGoogleSheets() {
  if (sheetsInstance) return sheetsInstance;

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    sheetsInstance = google.sheets({ version: 'v4', auth });
    return sheetsInstance;
  } catch (error) {
    console.error('Error al inicializar Google Sheets:', error);
    throw new Error('Error al inicializar Google Sheets');
  }
}

