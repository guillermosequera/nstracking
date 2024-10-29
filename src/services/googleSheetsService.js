// src/services/googleSheetsService.js
import { google } from 'googleapis';
import { getAuthClient } from '../utils/googleAuth';

class googleSheetsService {
  constructor() {
    this.sheets = null;
  }

  async init() {
    if (this.sheets) return;
    const auth = await getAuthClient();
    this.sheets = google.sheets({ version: 'v4', auth });
  }

  async getSheetData(sheetId, range) {
    await this.init();
    const response = await this.sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range,
    });
    return response.data.values || [];
  }

  async appendSheetData(sheetId, range, values) {
    await this.init();
    return this.sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values },
    });
  }
}

// Singleton instance
const instance = new googleSheetsService();
Object.freeze(instance);

export default instance;