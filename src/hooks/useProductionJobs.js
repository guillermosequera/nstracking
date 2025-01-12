import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchProductionJobs } from '@/utils/jobUtils'
import { productionQueryConfig, cacheConfig } from '@/config/queryConfig'

export function useProductionJobs() {
  const queryClient = useQueryClient()
  const queryKey = cacheConfig.generateQueryKey('production-jobs')

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      console.log('Fetching production jobs...')
      try {
        const data = await fetchProductionJobs()
        return data
      } catch (error) {
        console.error('Error fetching production jobs:', error)
        throw error
      }
    },
    ...productionQueryConfig,
    onSuccess: (data) => {
      console.log('Production jobs fetched successfully:', {
        totalEstados: Object.keys(data).length
      })
    }
  })

  // Función mejorada de refetch
  const refetch = async () => {
    try {
      await queryClient.invalidateQueries({
        queryKey,
        refetchType: 'active'
      })

      const result = await queryClient.fetchQuery({
        queryKey,
        queryFn: fetchProductionJobs,
        staleTime: 0
      })

      queryClient.setQueryData(queryKey, result)

      return { data: result }
    } catch (error) {
      console.error('Error al refrescar trabajos de producción:', error)
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