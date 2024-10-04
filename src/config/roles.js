// src/config/roles.js

export const roles = {
    admin: ['admin@example.com'],
    adminProduction: ['adminProduction@example.com'],
    adminFinance: ['adminFinance@example.com'],
    adminCommerce: ['adminCommerce@example.com'],
    adminRRHH: ['adminRRHH@example.com'],
    adminAdmin: ['adminAdmin@example.com'],
    workerWareHouse: [
                      'bodegacentral@italoptic.cl',
                      'bodegaitaloptic@gmail.com',
                      'bodegacentraltrento@gmail.com',
                    ],
    workerCommerce: [
                      'ejecutivo4@italoptic.cl', 
                      'tecnico.ti@italoptic.cl', 
                      'ejecutivo3@italoptic.cl', 
                      'contacto@italoptic.cl', 
                      'ejecutivo2@italoptic.cl',
                      'asistentecomercial@italoptic.cl',
                      'conveniostrento@opticatrento.cl',
                      'contacto@opticatrento.cl'
                    ],
    workerQuality: ['quality@example.com'],
    workerLabs: ['superficie@italoptic.cl'],
    workerLabsAR: ['aritaloptic@gmail.com'],
    workerLabsMineral: ['mineralesitaloptic@gmail.com', 'italopticasistentemantencion@gmail.com'],
    workerMontage: ['italopticmontaje@gmail.com'],
    workerDispatch: ['asisdepachoitaloptic@gmail.com', 'asisdepachoitaloptic2@gmail.com', 'despacho@italoptic.cl'],
  };
  
  export const sheetIds = {
    admin: process.env.NEXT_PUBLIC_SHEET_ID_ADMIN_SHEET,
    adminProduction: process.env.NEXT_PUBLIC_SHEET_ID_PRODUCTION_SHEET,
    adminFinance: process.env.NEXT_PUBLIC_SHEET_ID_FINANCE_SHEET,
    adminCommerce: process.env.NEXT_PUBLIC_SHEET_ID_COMMERCE_SHEET,
    adminRRHH: process.env.NEXT_PUBLIC_SHEET_ID_RRHH_SHEET,
    adminAdmin: process.env.NEXT_PUBLIC_SHEET_ID_ADMIN_SHEET,
    workerWareHouse: process.env.NEXT_PUBLIC_SHEET_ID_WAREHOUSE_SHEET,
    workerCommerce: process.env.NEXT_PUBLIC_SHEET_ID_COMMERCE_SHEET,
    workerQuality: process.env.NEXT_PUBLIC_SHEET_ID_QUALITY_SHEET,
    workerLabs: process.env.NEXT_PUBLIC_SHEET_ID_LABS_SHEET,
    workerLabsMineral: process.env.NEXT_PUBLIC_SHEET_ID_LABS_MINERAL_SHEET,
    workerLabsAR: process.env.NEXT_PUBLIC_SHEET_ID_LABS_AR_SHEET,
    workerMontage: process.env.NEXT_PUBLIC_SHEET_ID_MONTAGE_SHEET,
    workerDispatch: process.env.NEXT_PUBLIC_SHEET_ID_DISPATCH_SHEET,
    status: process.env.NEXT_PUBLIC_SHEET_ID_STATUS_SHEET,
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
    'workerLabsMineral',
    'workerLabsAR',
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