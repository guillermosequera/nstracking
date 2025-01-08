import { google } from 'googleapis';
import { getAuthClient } from './googleAuth';
import { sheetIds } from '@/config/roles';
import { getStatusFromPage, syncJobStatus } from './jobUtils';

export const addJobWithFile = async (jobData, userEmail, role, activePage) => {
  console.log(`Adding job with file for user: ${userEmail} on page: ${activePage}, role: ${role}`);
  const timestamp = new Date().toISOString();
  try {
    const { jobNumber, deliveryDate, lenswareNumber, fileLink } = jobData;
    const status = getStatusFromPage(activePage);
    const effectiveRole = role || 'workerCommerce';
    const sheetId = sheetIds[effectiveRole];

    if (!sheetId) {
      throw new Error(`Invalid role: ${effectiveRole}`);
    }

    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const values = [[String(jobNumber), timestamp, deliveryDate, lenswareNumber, fileLink, userEmail]];

    // Agregar a la hoja del área
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });

    // Sincronizar con la hoja de estado
    await syncJobStatus(jobNumber, {
      area: activePage,
      status: status
    }, userEmail);

    console.log('Added new job with file:', { jobNumber, timestamp, deliveryDate, lenswareNumber, fileLink, userEmail, status });
    return { jobNumber, timestamp, deliveryDate, lenswareNumber, fileLink, userEmail, status };
  } catch (error) {
    console.error('Error adding job with file:', error);
    throw error;
  }
};

export const addJobWithoutFile = async (jobData, userEmail, role, activePage) => {
  console.log(`Adding job without file for user: ${userEmail} on page: ${activePage}, role: ${role}`);
  const timestamp = new Date().toISOString();
  try {
    const { jobNumber, deliveryDate, lenswareNumber } = jobData;
    const status = getStatusFromPage(activePage);
    const effectiveRole = role || 'workerCommerce';
    const sheetId = sheetIds[effectiveRole];

    if (!sheetId) {
      throw new Error(`Invalid role: ${effectiveRole}`);
    }

    const auth = await getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const values = [[String(jobNumber), timestamp, deliveryDate, lenswareNumber, '', userEmail]];

    // Agregar a la hoja del área
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: 'A:F',
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });

    // Sincronizar con la hoja de estado
    await syncJobStatus(jobNumber, {
      area: activePage,
      status: status
    }, userEmail);

    console.log('Added new job without file:', { jobNumber, timestamp, deliveryDate, lenswareNumber, userEmail, status });
    return { jobNumber, timestamp, deliveryDate, lenswareNumber, userEmail, status };
  } catch (error) {
    console.error('Error adding job without file:', error);
    throw error;
  }
};