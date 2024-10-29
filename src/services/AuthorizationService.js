// src/services/AuthorizationService.js
import { permissionService } from '@/services/PermissionService';
import { roleService } from '@/services/roleService';

class AuthorizationService {
  constructor() {
    if (AuthorizationService.instance) {
      return AuthorizationService.instance;
    }
    AuthorizationService.instance = this;
  }

  canAccessRoute(userRole, path) {
    return permissionService.hasPermission(userRole, 'access', path);
  }

  canPerformAction(userRole, action, resource) {
    return permissionService.hasPermission(userRole, action, resource);
  }

  getRoleRedirects() {
    return {
      admin: '/admin',
      adminProduction: '/admin/production',
      adminFinance: '/admin/finance',
      adminCommerce: '/admin/commerce',
      adminRRHH: '/admin/rrhh',
      adminAdmin: '/admin',
      workerWareHouse: '/worker/warehouse',
      workerCommerce: '/worker/commerce',
      workerQuality: '/worker/quality',
      workerLabs: '/worker/labs',
      workerMontage: '/worker/montage',
      workerDispatch: '/worker/dispatch',
      default: '/status',
    };
  }

  hasRole(userRole, requiredRole) {
    return roleService.hasRole(userRole, requiredRole);
  }
}

export const authorizationService = new AuthorizationService();