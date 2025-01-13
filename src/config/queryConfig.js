// nstracking/src/config/queryConfig.js
import { fetchDelayedJobs, fetchProductionJobs } from '@/utils/jobUtils';

// Configuración base para todas las queries
export const defaultQueryConfig = {
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 2,
      staleTime: 2 * 60 * 1000, // 2 minutos
      cacheTime: 5 * 60 * 1000, // 5 minutos
      refetchInterval: false
    }
  }
};

// Configuración específica para producción y trabajos atrasados
// Ambos usan la misma fuente de datos, así que compartirán configuración
const sharedQueryConfig = {
  staleTime: 2 * 60 * 1000,    // 2 minutos
  cacheTime: 5 * 60 * 1000,    // 5 minutos
  retry: 3,
  refetchOnMount: true
};

export const productionQueryConfig = {
  ...sharedQueryConfig
};

export const delayedJobsQueryConfig = {
  ...sharedQueryConfig
};

// Clave compartida para el caché ya que ambos usan job-processing
export const SHARED_CACHE_KEY = 'job-processing-status';

// Mapeo de funciones fetch por key
export const queryFunctions = {
  [SHARED_CACHE_KEY]: {
    delayed: fetchDelayedJobs,
    production: fetchProductionJobs
  }
};

// Utilidades para el manejo de queries
export const queryUtils = {
  // Genera una key consistente para las queries
  generateQueryKey: (type) => [SHARED_CACHE_KEY, type],
  
  // Obtiene la función fetch correspondiente
  getQueryFunction: (type) => {
    const fetchFn = queryFunctions[SHARED_CACHE_KEY]?.[type];
    if (!fetchFn) {
      console.error(`No se encontró función fetch para: ${type}`);
      throw new Error(`Missing fetch function for: ${type}`);
    }
    return fetchFn;
  }
};