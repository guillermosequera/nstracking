// src/config/roles.js

export const roles = {
    admin: ['admin@example.com'],
    adminProduction: ['adminProduction@example.com', 
                      'produccion@italoptic.cl', 
                      'tecnico.ti@italoptic.cl',
    ],
    adminFinance: ['adminFinance@example.com'],
    adminCommerce: ['adminCommerce@example.com'],
    adminRRHH: ['adminRRHH@example.com'],
    adminAdmin: ['adminAdmin@example.com'],
    workerWareHouse: [
                      'bodegacentral@italoptic.cl',
                      'bodegaitaloptic@gmail.com',
                      'bodegacentraltrento@gmail.com',
                      'italopticasistentemantencion@gmail.com',
                    ],
    workerCommerce: [
                      'ejecutivo4@italoptic.cl', 
                      'ejecutivo1@italoptic.cl',
                      'ejecutivo1@italoptic.cl',
                      'of.centro@italoptic.cl',
                      'coordinadorcomercial@opticatrento.cl',
                      'ejecutivo3@italoptic.cl', 
                      'contacto@italoptic.cl', 
                      'ejecutivo2@italoptic.cl',
                      'asistentecomercial@italoptic.cl',
                      'conveniostrento@opticatrento.cl',
                      'contacto@opticatrento.cl',
                    ],
    workerQuality: ['control.calidad@italoptic.cl'],
    workerLabs: ['superficie@italoptic.cl'],
    workerLabsAR: ['aritaloptic@gmail.com'],
    workerLabsMineral: ['mineralesitaloptic@gmail.com'],
    workerMontage: ['italopticmontaje@gmail.com'],
    workerDispatch: ['asisdepachoitaloptic@gmail.com', 'asisdepachoitaloptic2@gmail.com', 'despacho@italoptic.cl']
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
    statusHistory: process.env.NEXT_PUBLIC_SHEET_ID_STATUS_HISTORY_SHEET,
    statusNVHistory: process.env.NEXT_PUBLIC_SHEET_ID_STATUS_NV_HISTORY_SHEET,
    merma: process.env.NEXT_PUBLIC_SHEET_ID_MERMA_SHEET,
    garantia: process.env.NEXT_PUBLIC_SHEET_ID_WARRANTY_SHEET,
    unassignedDispatch: process.env.NEXT_PUBLIC_SHEET_ID_UNASSIGNED_DISPATCH_SHEET,
    transactionLogs: process.env.NEXT_PUBLIC_SHEET_ID_TRANSACTION_LOGS_SHEET,
  };
  
  export function getUserRole(email) {
    if (!email) {
      console.log('getUserRole: Email no proporcionado');
      return null;
    }
  
    console.log('getUserRole: Verificando email:', email);
  
    // Primero verificar roles de trabajador
    for (const role of workerRoles) {
      console.log(`Verificando rol ${role}`);
      if (roles[role].includes(email)) {
        console.log(`Email encontrado en rol ${role}`);
        return role;
      }
    }
  
    // Si no es trabajador, verificar roles admin
    for (const role of adminRoles) {
      console.log(`Verificando rol ${role}`);
      if (roles[role].includes(email)) {
        console.log(`Email encontrado en rol ${role}`);
        return role;
      }
    }
  
    console.log('No se encontró rol para el email');
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