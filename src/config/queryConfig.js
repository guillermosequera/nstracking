// nstracking/src/config/queryConfig.js
import { fetchDelayedJobs, fetchProductionJobs } from '@/utils/jobUtils';

// Configuración base para todas las queries
export const defaultQueryConfig = {
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
      staleTime: 30 * 1000, // 30 segundos
      cacheTime: 2 * 60 * 1000, // 2 minutos
      refetchInterval: false
    }
  }
};

// Configuración específica para producción
export const productionQueryConfig = {
  staleTime: 30 * 1000,    // 30 segundos
  cacheTime: 2 * 60 * 1000, // 2 minutos
  retry: 3,
  refetchOnMount: true
};

// Configuración específica para trabajos atrasados
export const delayedJobsQueryConfig = {
  staleTime: 30 * 1000,    // 30 segundos
  cacheTime: 2 * 60 * 1000, // 2 minutos
  retry: 3,
  refetchOnMount: true
};

// Mapeo de funciones fetch por key
export const queryFunctions = {
  'delayed-jobs': fetchDelayedJobs,
  'production-jobs': fetchProductionJobs
};

// Utilidades para el manejo de queries
export const queryUtils = {
  // Genera una key consistente para las queries
  generateQueryKey: (baseKey) => [baseKey],
  
  // Obtiene la función fetch correspondiente
  getQueryFunction: (baseKey) => {
    const fetchFn = queryFunctions[baseKey];
    if (!fetchFn) {
      console.error(`No se encontró función fetch para: ${baseKey}`);
      throw new Error(`Missing fetch function for: ${baseKey}`);
    }
    return fetchFn;
  }
};