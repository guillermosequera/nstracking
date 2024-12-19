import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchDelayedJobs } from '@/utils/jobUtils'

export function useDelayedJobs() {
  const queryClient = useQueryClient()
  const query = useQuery({
    queryKey: ['delayedJobs'],
    queryFn: fetchDelayedJobs,
    retry: 1,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    onError: (error) => {
      console.error('Error en useDelayedJobs:', error)
    }
  })

  const refetch = async () => {
    try {
      await queryClient.invalidateQueries(['delayedJobs'])
      return await queryClient.refetchQueries(['delayedJobs'])
    } catch (error) {
      console.error('Error al refrescar trabajos:', error)
      throw error
    }
  }

  return {
    ...query,
    refetch
  }
} 