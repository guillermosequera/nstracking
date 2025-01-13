// nstracking/src/hooks/useDelayedJobs.js

import { useQuery } from '@tanstack/react-query'
import { fetchDelayedJobs } from '@/utils/jobUtils'
import { queryUtils } from '@/config/queryConfig'

export function useDelayedJobs() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryUtils.generateQueryKey('delayed-jobs'),
    queryFn: async () => {
      console.log('Fetching delayed jobs...')
      const response = await fetchDelayedJobs()
      console.log('Delayed jobs fetched successfully')
      return response.data
    }
  })

  return {
    data,
    isLoading,
    error,
    refetch
  }
} 