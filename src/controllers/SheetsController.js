import { sheetIds } from '@/config/roles';
import { getStatusFromPage } from '@/utils/jobUtils';
import { getCachedData, setCachedData } from '@/utils/cacheUtils';
import { filterDataByTimeFrame } from '@/utils/dataUtils';

class SheetsController {
  constructor(googleSheetsService) {
    this.googleSheetsService = googleSheetsService;
  }

  async getSheetData(role, timeFrame) {
    try {
      const sheetId = sheetIds[role];
      if (!sheetId) {
        throw new Error(`Invalid role ${role}`);
      }

      const cacheKey = `${role}_${timeFrame}`;
      const cachedData = getCachedData(cacheKey);
      if (cachedData) return cachedData;

      const allValues = await this.googleSheetsService.getSheetData(sheetId, 'A:J');
      const filteredValues = filterDataByTimeFrame(allValues, timeFrame);
      
      setCachedData(cacheKey, filteredValues);
      return filteredValues;
    } catch (error) {
      console.error('Error getting sheet data:', error);
      throw new Error(`Failed to get sheet data: ${error.message}`);
    }
  }

  async getJobStatus(jobNumber) {
    try {
      const sheetId = sheetIds['status'];
      const allValues = await this.googleSheetsService.getSheetData(sheetId, 'A:E');
      return allValues.filter(row => row[0] === jobNumber);
    } catch (error) {
      console.error('Error getting job status:', error);
      throw new Error(`Failed to get job status: ${error.message}`);
    }
  }

  async addJob(jobData) {
    try {
      const { jobNumber, timestamp, userEmail, role, activePage } = jobData;
      const sheetId = sheetIds[role];
      const statusSheetId = sheetIds['status'];

      const values = [[jobNumber, timestamp, userEmail]];
      const status = getStatusFromPage(activePage);
      const statusValues = [[jobNumber, timestamp, activePage, status, userEmail]];

      await this.googleSheetsService.appendSheetData(sheetId, 'A:C', values);
      await this.googleSheetsService.appendSheetData(statusSheetId, 'A:E', statusValues);

      return { jobNumber, timestamp, userEmail, status };
    } catch (error) {
      console.error('Error adding job:', error);
      throw new Error(`Failed to add job: ${error.message}`);
    }
  }
}

export default SheetsController;