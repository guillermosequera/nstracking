import { addCommonJob } from './commonJobUtils';

export async function addWarehouseJob(jobNumber, userEmail) {
  return addCommonJob(jobNumber, userEmail, 'workerWareHouse', 'warehouse');
}