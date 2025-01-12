// nstracking/src/config/queryConfig.js
import { fetchDelayedJobs, fetchProductionJobs } from '@/utils/jobUtils';

export const defaultQueryConfig = {
    // Configuración base para todas las queries
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
  
  // Configuración específica para producción
  export const productionQueryConfig = {
    staleTime: 2 * 60 * 1000,    // 2 minutos
    cacheTime: 5 * 60 * 1000,    // 5 minutos
    refetchInterval: 5 * 60 * 1000, // 5 minutos
    retry: 3
  };
  
  // Configuración específica para trabajos atrasados
  export const delayedJobsQueryConfig = {
    staleTime: 2 * 60 * 1000,    // 2 minutos
    cacheTime: 5 * 60 * 1000,    // 5 minutos
    retry: 1
  };
  
  // Configuración para el manejo de errores
  export const queryErrorConfig = {
    onError: (error) => {
      console.error('Error en la consulta:', error);
    }
  };

  // Mapeo de funciones fetch por key
  export const queryFunctions = {
    delayedJobs: fetchDelayedJobs,
    'production-jobs': fetchProductionJobs
  };
  
  // Configuración para el manejo de caché
  export const cacheConfig = {
    // Función para generar claves de caché consistentes
    generateQueryKey: (baseKey, params = {}) => {
      return [baseKey, params];
    },

    // Función para obtener la función fetch correspondiente
    getQueryFunction: (baseKey) => {
      const fetchFn = queryFunctions[baseKey];
      if (!fetchFn) {
        console.error(`No se encontró función fetch para la key: ${baseKey}`);
        throw new Error(`Missing queryFn for key: ${baseKey}`);
      }
      return fetchFn;
    },

    // Función para validar si existe una función fetch
    hasQueryFunction: (baseKey) => {
      return !!queryFunctions[baseKey];
    }
  };