import { useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { cacheConfig } from '@/config/queryConfig';

export function useRefreshData() {
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refreshAllData = useCallback(async () => {
    if (isRefreshing) return false;
    
    try {
      setIsRefreshing(true);
      
      // Crear un delay mínimo para la animación
      const minDelay = new Promise(resolve => setTimeout(resolve, 1000));
      
      // Invalidar queries usando las keys configuradas
      const invalidatePromises = [
        queryClient.invalidateQueries({
          queryKey: cacheConfig.generateQueryKey('delayedJobs'),
          refetchType: 'active'
        }),
        queryClient.invalidateQueries({
          queryKey: cacheConfig.generateQueryKey('production-jobs'),
          refetchType: 'active'
        })
      ];

      // Esperar la invalidación y el delay mínimo
      await Promise.all([
        Promise.all(invalidatePromises),
        minDelay
      ]);

      // Forzar refetch con staleTime 0
      const refetchPromises = [
        queryClient.fetchQuery({
          queryKey: cacheConfig.generateQueryKey('delayedJobs'),
          staleTime: 0
        }),
        queryClient.fetchQuery({
          queryKey: cacheConfig.generateQueryKey('production-jobs'),
          staleTime: 0
        })
      ];

      const results = await Promise.all(refetchPromises);
      
      // Actualizar el caché con los nuevos datos
      results.forEach((data, index) => {
        const queryKey = index === 0 
          ? cacheConfig.generateQueryKey('delayedJobs')
          : cacheConfig.generateQueryKey('production-jobs');
          
        queryClient.setQueryData(queryKey, data);
      });

      return true;
    } catch (error) {
      console.error('Error al actualizar datos:', error);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient, isRefreshing]);

  return { 
    refreshAllData,
    isRefreshing 
  };
}