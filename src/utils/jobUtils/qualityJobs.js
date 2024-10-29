import { addCommonJob } from './commonJobUtils';

export async function addQualityJob(jobNumber, userEmail) {
  return addCommonJob(jobNumber, userEmail, 'workerQuality', 'quality');
}