// nstracking/src/hooks/useDelayedJobs.js

import { useQuery } from '@tanstack/react-query'
import { fetchDelayedJobs } from '@/utils/jobUtils'
import { queryUtils } from '@/config/queryConfig'

export function useDelayedJobs() {
  const { data: trabajosAtrasados, isLoading, error, refetch } = useQuery({
    queryKey: queryUtils.generateQueryKey('delayed-jobs'),
    queryFn: async () => {
      console.log('Fetching delayed jobs...')
      const response = await fetchDelayedJobs()
      console.log('Delayed jobs fetched successfully')
      return response
    },
    staleTime: 0, // Considerar los datos obsoletos inmediatamente
    cacheTime: 0, // No cachear la respuesta
    refetchOnMount: true // Refetch al montar el componente
  })

  return {
    trabajosAtrasados,
    isLoading,
    error,
    refetch
  }
} 