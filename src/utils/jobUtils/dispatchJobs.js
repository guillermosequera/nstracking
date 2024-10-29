// src/utils/jobUtils/dispatchJobs.js

import { getStatusFromPage } from '../statusUtils';
import { handleApiError } from '../errorUtils';
import { sheetIds } from '@/config/roles';

export function createDispatchJobs(sheetsService) {
  async function addDispatchJob(jobData, userEmail) {
    try {
      const sheetId = sheetIds['workerDispatch'];
      const status = getStatusFromPage('dispatch');
      const values = [
        [
          jobData.jobNumber,
          new Date().toISOString(),
          jobData.company,
          jobData.agreement || jobData.client,
          jobData.invoiceNumber || '',
          jobData.shippingCompany || '',
          jobData.shippingOrder || '',
          userEmail,
          status
        ]
      ];
      const range = 'A:I';  // Ajusta esto según tus necesidades
      await sheetsService.appendSheetData(sheetId, range, values);
      return { ...jobData, timestamp: new Date().toISOString(), userEmail, status };
    } catch (error) {
      handleApiError(error, 'Failed to add dispatch job');
    }
  }

  return { addDispatchJob };
}