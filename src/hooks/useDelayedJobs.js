// nstracking/src/hooks/useDelayedJobs.js

import { useQuery } from '@tanstack/react-query'
import { fetchDelayedJobs } from '@/utils/jobUtils'
import { delayedJobsQueryConfig, queryUtils } from '@/config/queryConfig'

export function useDelayedJobs() {
  const queryKey = queryUtils.generateQueryKey('delayed-jobs')
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      console.log('Fetching delayed jobs...')
      try {
        const data = await fetchDelayedJobs()
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