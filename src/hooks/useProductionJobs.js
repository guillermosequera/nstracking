import { useQuery } from '@tanstack/react-query'
import { fetchProductionJobs } from '@/utils/jobUtils'

export function useProductionJobs() {
  const { data: trabajosAgrupados = {}, isLoading, error, refetch } = useQuery({
    queryKey: ['production-jobs'],
    queryFn: async () => {
      console.log('Fetching production jobs...')
      const response = await fetchProductionJobs()
      console.log('Production jobs fetched successfully')
      return response.data || {}
    },
    retry: 3,
    refetchOnWindowFocus: false,
    enabled: true
  })

  return {
    trabajosAgrupados,
    isLoading,
    error,
    refetch
  }
} 