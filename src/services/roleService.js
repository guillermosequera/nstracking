import { ROLE } from '@/constants/roleConstants';
import { roleCache } from '@/services/roleCache';
import { googleSheetsService } from '@/services/googleSheetsService';

class RoleService {
  constructor(roles, roleHierarchy) {
    if (RoleService.instance) {
      return RoleService.instance;
    }
    
    this.roles = roles;
    this.roleHierarchy = roleHierarchy;
    this.sheetId = process.env.NEXT_PUBLIC_SHEET_ID_ROLES_SHEET;
    this.range = 'Roles!A:B';
    
    RoleService.instance = this;
  }

  async getUserRoles(email) {
    if (roleCache.has(email)) {
      return roleCache.get(email);
    }

    const localRoles = this.getLocalRoles(email);
    if (localRoles.length > 0) {
      roleCache.set(email, localRoles);
      return localRoles;
    }

    try {
      const sheetData = await googleSheetsService.getSheetData(this.sheetId, this.range);
      const userRow = sheetData.find(row => row[0] === email);
      if (userRow) {
        const roles = userRow[1].split(',').map(role => role.trim());
        roleCache.set(email, roles);
        return roles;
      }
    } catch (error) {
      console.error('Error fetching roles from Google Sheets:', error);
    }

    console.warn(`No se encontró un rol para el email: ${email}`);
    return [];
  }

  getLocalRoles(email) {
    const userRoles = [];
    for (const [role, emails] of Object.entries(this.roles)) {
      if (emails.includes(email)) {
        userRoles.push(role);
        if (this.roleHierarchy[role]) {
          userRoles.push(...this.roleHierarchy[role]);
        }
      }
    }
    return [...new Set(userRoles)];
  }

  hasRole(userRoles, requiredRole) {
    if (Array.isArray(userRoles)) {
      return userRoles.some(role => {
        if (role === requiredRole) return true;
        const hierarchyRoles = this.roleHierarchy[role] || [];
        return hierarchyRoles.includes(requiredRole);
      });
    }
    return false;
  }

  getAvailableViews(userRoles) {
    const views = new Set();
    userRoles.forEach(role => {
      views.add(this.getRoleDefaultView(role));
      if (this.roleHierarchy[role]) {
        this.roleHierarchy[role].forEach(inheritedRole => {
          views.add(this.getRoleDefaultView(inheritedRole));
        });
      }
    });
    return Array.from(views).filter(Boolean);
  }

  getRoleDefaultView(role) {
    const viewMap = {
      [ROLE.ADMIN]: '/admin',
      [ROLE.ADMIN_PRODUCTION]: '/admin/production',
      [ROLE.ADMIN_FINANCE]: '/admin/finance',
      [ROLE.ADMIN_COMMERCE]: '/admin/commerce',
      [ROLE.ADMIN_RRHH]: '/admin/rrhh',
      [ROLE.ADMIN_ADMIN]: '/admin',
      [ROLE.WORKER_WAREHOUSE]: '/worker/warehouse',
      [ROLE.WORKER_COMMERCE]: '/worker/commerce',
      [ROLE.WORKER_QUALITY]: '/worker/quality',
      [ROLE.WORKER_LABS]: '/worker/labs',
      [ROLE.WORKER_MONTAGE]: '/worker/montage',
      [ROLE.WORKER_DISPATCH]: '/worker/dispatch',
    };
    return viewMap[role];
  }
}

const roles = {
  [ROLE.ADMIN]: ['admin@example.com'],
  [ROLE.ADMIN_PRODUCTION]: ['adminProduction@example.com'],
  [ROLE.ADMIN_FINANCE]: ['adminFinance@example.com'],
  [ROLE.ADMIN_COMMERCE]: ['adminCommerce@example.com'],
  [ROLE.ADMIN_RRHH]: ['adminRRHH@example.com', 'italopticasistentemantencion@gmail.com'],
  [ROLE.ADMIN_ADMIN]: ['adminAdmin@example.com'],
  [ROLE.WORKER_WAREHOUSE]: [
    'bodegacentral@italoptic.cl',
    'bodegaitaloptic@gmail.com',
    'bodegacentraltrento@gmail.com',
  ],
  [ROLE.WORKER_COMMERCE]: [
    'ejecutivo4@italoptic.cl', 
    'tecnico.ti@italoptic.cl', 
    'ejecutivo3@italoptic.cl', 
    'contacto@italoptic.cl', 
    'ejecutivo2@italoptic.cl',
    'asistentecomercial@italoptic.cl',
    'conveniostrento@opticatrento.cl',
    'contacto@opticatrento.cl',
  ],
  [ROLE.WORKER_QUALITY]: ['control.calidad@italoptic.cl'],
  [ROLE.WORKER_LABS]: ['superficie@italoptic.cl'],
  [ROLE.WORKER_LABS_AR]: ['aritaloptic@gmail.com'],
  [ROLE.WORKER_LABS_MINERAL]: ['mineralesitaloptic@gmail.com'],
  [ROLE.WORKER_MONTAGE]: ['italopticmontaje@gmail.com'],
  [ROLE.WORKER_DISPATCH]: ['asisdepachoitaloptic@gmail.com', 'asisdepachoitaloptic2@gmail.com', 'despacho@italoptic.cl'],
};

const roleHierarchy = {
  [ROLE.ADMIN_ADMIN]: [ROLE.ADMIN, ROLE.ADMIN_PRODUCTION, ROLE.ADMIN_FINANCE, ROLE.ADMIN_COMMERCE, ROLE.ADMIN_RRHH],
  [ROLE.ADMIN]: [ROLE.WORKER_WAREHOUSE, ROLE.WORKER_COMMERCE, ROLE.WORKER_QUALITY, ROLE.WORKER_LABS, ROLE.WORKER_LABS_MINERAL, ROLE.WORKER_LABS_AR, ROLE.WORKER_MONTAGE, ROLE.WORKER_DISPATCH],
};

export const roleService = new RoleService(roles, roleHierarchy);