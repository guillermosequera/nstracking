// src/utils/googleAuth.js
import { google } from 'googleapis';

const getGCPCredentials = () => {
  if (!process.env.GCP_PRIVATE_KEY || !process.env.GCP_SERVICE_ACCOUNT_EMAIL || !process.env.GCP_PROJECT_ID) {
    console.error('Missing GCP environment variables');
    throw new Error('Missing GCP credentials');
  }
  console.log('GCP credentials obtained successfully');
  return {
    credentials: {
      client_email: process.env.GCP_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GCP_PRIVATE_KEY.replace(/\\n/g, '\n'),
    },
    projectId: process.env.GCP_PROJECT_ID,
  };
};

export const getAuthClient = () => {
  try {
    const credentials = getGCPCredentials();
    console.log('Creating Google Auth client');
    return new google.auth.GoogleAuth({
      ...credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  } catch (error) {
    console.error('Error creating Google Auth client:', error);
    throw error;
  }
};