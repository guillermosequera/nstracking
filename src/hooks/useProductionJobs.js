import { useQuery } from '@tanstack/react-query'
import { fetchProductionJobs } from '@/utils/jobUtils'
import { queryUtils } from '@/config/queryConfig'

export function useProductionJobs() {
  const { data: trabajosAgrupados, isLoading, error, refetch } = useQuery({
    queryKey: queryUtils.generateQueryKey('production-jobs'),
    queryFn: async () => {
      console.log('Fetching production jobs...')
      const response = await fetchProductionJobs()
      console.log('Production jobs fetched successfully')
      return response
    },
    staleTime: 0, // Considerar los datos obsoletos inmediatamente
    cacheTime: 0, // No cachear la respuesta
    refetchOnMount: true // Refetch al montar el componente
  })

  return {
    trabajosAgrupados,
    isLoading,
    error,
    refetch
  }
} 