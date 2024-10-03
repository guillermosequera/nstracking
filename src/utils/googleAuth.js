import { google } from 'googleapis';

const getGCPCredentials = () => {
  if (!process.env.GCP_PRIVATE_KEY || !process.env.GCP_SERVICE_ACCOUNT_EMAIL || !process.env.GCP_PROJECT_ID) {
    console.error('Faltan variables de entorno para las credenciales GCP');
    return null;
  }
  return {
    credentials: {
      client_email: process.env.GCP_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GCP_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    projectId: process.env.GCP_PROJECT_ID,
  };
};

export const getAuthClient = () => {
  const credentials = getGCPCredentials();
  if (!credentials) {
    throw new Error('No se pudieron obtener las credenciales GCP');
  }
  return new google.auth.GoogleAuth({
    ...credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/spreadsheets'],
  });
};