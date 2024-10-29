export const ROLE = {
    ADMIN: 'admin',
    ADMIN_PRODUCTION: 'adminProduction',
    ADMIN_FINANCE: 'adminFinance',
    ADMIN_COMMERCE: 'adminCommerce',
    ADMIN_RRHH: 'adminRRHH',
    ADMIN_ADMIN: 'adminAdmin',
    WORKER_WAREHOUSE: 'workerWareHouse',
    WORKER_COMMERCE: 'workerCommerce',
    WORKER_QUALITY: 'workerQuality',
    WORKER_LABS: 'workerLabs',
    WORKER_LABS_MINERAL: 'workerLabsMineral',
    WORKER_LABS_AR: 'workerLabsAR',
    WORKER_MONTAGE: 'workerMontage',
    WORKER_DISPATCH: 'workerDispatch',
  };
  
  export const workerRoles = [
    ROLE.WORKER_WAREHOUSE,
    ROLE.WORKER_COMMERCE,
    ROLE.WORKER_QUALITY,
    ROLE.WORKER_LABS,
    ROLE.WORKER_LABS_MINERAL,
    ROLE.WORKER_LABS_AR,
    ROLE.WORKER_MONTAGE,
    ROLE.WORKER_DISPATCH
  ];
  
  export const adminRoles = [
    ROLE.ADMIN,
    ROLE.ADMIN_PRODUCTION,
    ROLE.ADMIN_FINANCE,
    ROLE.ADMIN_COMMERCE,
    ROLE.ADMIN_RRHH,
    ROLE.ADMIN_ADMIN
  ];