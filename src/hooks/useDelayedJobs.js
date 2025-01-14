// nstracking/src/hooks/useDelayedJobs.js

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchDelayedJobs } from '@/utils/jobUtils'
import { delayedJobsQueryConfig, queryUtils } from '@/config/queryConfig'

export function useDelayedJobs() {
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryUtils.generateQueryKey('delayed-jobs'),
    queryFn: async () => {
      console.log('Iniciando fetch de trabajos atrasados...')
      try {
        const response = await fetchDelayedJobs()
        console.log('Trabajos atrasados obtenidos:', response)
        return response
      } catch (error) {
        console.error('Error al obtener trabajos atrasados:', error)
        throw error
      }
    },
    ...delayedJobsQueryConfig,
    staleTime: 0, // Forzar revalidación inmediata
    cacheTime: 1000 * 60, // Cache por 1 minuto
    refetchOnMount: true,
    refetchOnWindowFocus: true
  })

  const forceRefresh = async () => {
    console.log('Forzando actualización de trabajos atrasados...')
    // Invalidar el caché actual
    await queryClient.invalidateQueries(queryUtils.generateQueryKey('delayed-jobs'))
    // Realizar el refetch
    const result = await refetch()
    console.log('Resultado del refetch forzado:', result)
    return result
  }

  return {
    data,
    isLoading,
    error,
    refetch: forceRefresh
  }
} 