// src/config/roles.js

export const roles = {
    admin: ['admin@example.com'],
    adminProduction: ['opticasequera@gmail.com'],
    adminFinance: ['adminFinance@example.com'],
    adminCommerce: ['adminCommerce@example.com'],
    adminRRHH: ['adminRRHH@example.com'],
    adminAdmin: ['tecnico.ti@italoptic.cl'],
    workerWareHouse: ['warehouse@example.com'],
    workerCommerce: ['opticaselen@gmail.com'],
    workerQuality: ['quality@example.com'],
    workerLabs: ['labs@example.com'],
    workerMontage: ['montage@example.com'],
    workerDispatch: ['dispatch@example.com'],
  };
  
  export const sheetIds = {
    admin: 'ADMIN_SHEET_ID_HERE',
    adminProduction: 'PRODUCTION_SHEET_ID_HERE',
    adminFinance: 'FINANCE_SHEET_ID_HERE',
    adminCommerce: 'COMMERCE_SHEET_ID_HERE',
    adminRRHH: 'RRHH_SHEET_ID_HERE',
    adminAdmin: 'ADMIN_SHEET_ID_HERE',
    workerWareHouse: 'WAREHOUSE_SHEET_ID_HERE',
    workerCommerce: 'COMMERCE_SHEET_ID_HERE',
    workerQuality: 'QUALITY_SHEET_ID_HERE',
    workerLabs: 'LABS_SHEET_ID_HERE',
    workerMontage: 'MONTAGE_SHEET_ID_HERE',
    workerDispatch: 'DISPATCH_SHEET_ID_HERE',
    status: 'STATUS_SHEET_ID_HERE',
  };
  
  export function getUserRole(email) {
    for (const [role, emails] of Object.entries(roles)) {
      if (emails.includes(email)) {
        return role;
      }
    }
    return null;
  }
  
  export const workerRoles = [
    'workerWareHouse',
    'workerCommerce',
    'workerQuality',
    'workerLabs',
    'workerMontage',
    'workerDispatch'
  ];

  export const adminRoles = [
    'admin',
    'adminProduction',
    'adminFinance',
    'adminCommerce',
    'adminRRHH',
    'adminAdmin'
  ];