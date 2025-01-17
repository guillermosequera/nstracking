import { useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { cacheConfig } from '@/config/queryConfig';

export function useRefreshData() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const refreshAllData = useCallback(async () => {
    if (isRefreshing) return false;
    
    try {
      setIsRefreshing(true);
      setError(null);
      
      // Crear un delay mínimo para la animación
      const minDelay = new Promise(resolve => setTimeout(resolve, 1000));
      
      // Lista de keys a refrescar
      const keysToRefresh = ['delayedJobs', 'production-jobs'];
      
      // Validar que todas las keys tengan funciones fetch
      keysToRefresh.forEach(key => {
        if (!cacheConfig.hasQueryFunction(key)) {
          throw new Error(`No se encontró función fetch para: ${key}`);
        }
      });

      // Invalidar queries usando las keys configuradas
      const invalidatePromises = keysToRefresh.map(key => {
        // Primero removemos los datos del caché
        queryClient.removeQueries({
          queryKey: cacheConfig.generateQueryKey(key),
          exact: true
        });
        
        // Luego invalidamos la query
        return queryClient.invalidateQueries({
          queryKey: cacheConfig.generateQueryKey(key),
          refetchType: 'active',
          exact: true
        });
      });

      // Esperar la invalidación y el delay mínimo
      await Promise.all([
        Promise.all(invalidatePromises),
        minDelay
      ]);

      // Forzar refetch con las funciones correspondientes
      const refetchPromises = keysToRefresh.map(key => 
        queryClient.fetchQuery({
          queryKey: cacheConfig.generateQueryKey(key),
          queryFn: cacheConfig.getQueryFunction(key),
          staleTime: 0
        })
      );

      const results = await Promise.all(refetchPromises);
      
      // Actualizar el caché con los nuevos datos
      results.forEach((data, index) => {
        const key = keysToRefresh[index];
        queryClient.setQueryData(cacheConfig.generateQueryKey(key), data);
      });

      return true;
    } catch (error) {
      console.error('Error al actualizar datos:', error);
      setError(error);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, isRefreshing]);

  return { 
    refreshAllData,
    isRefreshing,
    error 
  };
}