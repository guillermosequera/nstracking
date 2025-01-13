import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchProductionJobs } from '@/utils/jobUtils'
import { productionQueryConfig, queryUtils, SHARED_CACHE_KEY } from '@/config/queryConfig'

export function useProductionJobs() {
  const queryClient = useQueryClient()
  const queryKey = queryUtils.generateQueryKey('production')
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      console.log('Fetching production jobs...')
      try {
        const data = await fetchProductionJobs()
        
        // Invalidar el caché compartido para asegurar consistencia
        queryClient.invalidateQueries({
          queryKey: [SHARED_CACHE_KEY],
          exact: false,
          refetchType: 'none'
        })
        
        console.log('Production jobs fetched successfully:', {
          totalEstados: Object.keys(data).length
        })
        return data
      } catch (error) {
        console.error('Error fetching production jobs:', error)
        throw error
      }
    },
    ...productionQueryConfig
  })
} 