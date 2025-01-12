// nstracking/src/hooks/useDelayedJobs.js

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchDelayedJobs } from '@/utils/jobUtils'
import { delayedJobsQueryConfig, cacheConfig } from '@/config/queryConfig'

export function useDelayedJobs() {
  const queryClient = useQueryClient()
  const queryKey = cacheConfig.generateQueryKey('delayedJobs')
  
  const query = useQuery({
    queryKey,
    queryFn: fetchDelayedJobs,
    ...delayedJobsQueryConfig,
    select: (data) => {
      if (!data) return []
      return data
    }
  })

  // Función mejorada de refetch
  const refetch = async () => {
    try {
      // Invalidamos la query actual
      await queryClient.invalidateQueries({
        queryKey,
        refetchType: 'active'
      })

      // Forzamos nueva obtención de datos
      const result = await queryClient.fetchQuery({
        queryKey,
        queryFn: fetchDelayedJobs,
        staleTime: 0
      })

      // Actualizamos el caché
      queryClient.setQueryData(queryKey, result)

      return { data: result }
    } catch (error) {
      console.error('Error al refrescar trabajos atrasados:', error)
      throw error
    }
  }

  return {
    ...query,
    refetch,
    isLoading: query.isLoading,
    error: query.error
  }
} 