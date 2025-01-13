import { useQuery } from '@tanstack/react-query'
import { fetchProductionJobs } from '@/utils/jobUtils'
import { queryUtils } from '@/config/queryConfig'

export function useProductionJobs() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryUtils.generateQueryKey('production-jobs'),
    queryFn: async () => {
      console.log('Fetching production jobs...')
      const response = await fetchProductionJobs()
      console.log('Production jobs fetched successfully')
      return response.data
    }
  })

  return {
    trabajosAgrupados: data,
    isLoading,
    error,
    refetch
  }
} 