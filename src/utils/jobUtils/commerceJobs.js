import { addCommonJob } from './commonJobUtils';

export async function addCommerceJob(jobNumber, userEmail) {
  return addCommonJob(jobNumber, userEmail, 'workerCommerce', 'commerce');
}