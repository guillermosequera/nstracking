// nstracking/src/config/queryConfig.js
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
  
  // Configuración para el manejo de caché
  export const cacheConfig = {
    // Función para generar claves de caché consistentes
    generateQueryKey: (baseKey, params = {}) => {
      return [baseKey, params];
    }
  };