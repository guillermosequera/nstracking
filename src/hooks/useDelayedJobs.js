// nstracking/src/hooks/useDelayedJobs.js

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchDelayedJobs } from '@/utils/jobUtils'
import { delayedJobsQueryConfig, queryUtils, SHARED_CACHE_KEY } from '@/config/queryConfig'

export function useDelayedJobs() {
  const queryClient = useQueryClient()
  const queryKey = queryUtils.generateQueryKey('delayed')
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      console.log('Fetching delayed jobs...')
      try {
        const data = await fetchDelayedJobs()
        
        // Invalidar el caché compartido para asegurar consistencia
        queryClient.invalidateQueries({
          queryKey: [SHARED_CACHE_KEY],
          exact: false,
          refetchType: 'none'
        })
        
        console.log('Delayed jobs fetched successfully:', {
          totalJobs: data?.length || 0
        })
        return data
      } catch (error) {
        console.error('Error fetching delayed jobs:', error)
        throw error
      }
    },
    ...delayedJobsQueryConfig,
    onSuccess: (data) => {
      console.log('Delayed jobs fetched successfully:', {
        totalJobs: data?.length || 0
      })
    }
  })
} 