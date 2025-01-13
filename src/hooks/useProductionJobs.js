import { useQuery } from '@tanstack/react-query'
import { fetchProductionJobs } from '@/utils/jobUtils'
import { productionQueryConfig, queryUtils } from '@/config/queryConfig'

export function useProductionJobs() {
  const queryKey = queryUtils.generateQueryKey('production-jobs')
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      console.log('Fetching production jobs...')
      try {
        const data = await fetchProductionJobs()
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