import { useQuery } from '@tanstack/react-query'
import { fetchProductionJobs } from '@/utils/jobUtils'

export function useProductionJobs() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['production-jobs'],
    queryFn: async () => {
      console.log('Fetching production jobs...')
      const response = await fetchProductionJobs()
      console.log('Production jobs fetched successfully:', response)
      return response
    },
    retry: 3,
    enabled: true
  })

  return {
    trabajosAgrupados: data,
    isLoading,
    error,
    refetch
  }
} 