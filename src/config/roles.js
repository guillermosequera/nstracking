import { ROLE, workerRoles, adminRoles } from '../constants/roleConstants';
import { sheetIds } from './sheetConfig';
import { roleService } from '../services/roleService';

export { ROLE, workerRoles, adminRoles, sheetIds };
export const getUserRole = roleService.getUserRole.bind(roleService);
export const hasRole = roleService.hasRole.bind(roleService);