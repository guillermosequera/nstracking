// src/utils/jobUtils/commonJobUtils.js

import { getStatusFromPage } from '../statusUtils';
import { handleApiError } from '../errorUtils';
import { sheetIds } from '@/config/roles';

export function createJobUtils(sheetsService) {
  async function fetchJobs(timeFrame, role) {
    try {
      const sheetId = sheetIds[role];
      const range = 'A:J';  // Ajusta esto según tus necesidades
      const data = await sheetsService.getSheetData(sheetId, range);
      return filterDataByTimeFrame(data, timeFrame);
    } catch (error) {
      handleApiError(error, `Error fetching jobs for ${timeFrame}`);
    }
  }

  async function addCommonJob(jobNumber, userEmail, role, activePage) {
    try {
      const sheetId = sheetIds[role];
      const status = getStatusFromPage(activePage);
      const values = [[jobNumber, new Date().toISOString(), userEmail, status]];
      const range = 'A:D';  // Ajusta esto según tus necesidades
      await sheetsService.appendSheetData(sheetId, range, values);
      return { jobNumber, timestamp: new Date().toISOString(), userEmail, status };
    } catch (error) {
      handleApiError(error, 'Failed to add job');
    }
  }

  function filterDataByTimeFrame(data, timeFrame) {
    // Implementa la lógica de filtrado aquí
    // ...
  }

  return { fetchJobs, addCommonJob };
}