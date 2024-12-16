import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchDelayedJobs } from '@/utils/jobUtils'

export function useDelayedJobs() {
  return useQuery({
    queryKey: ['delayedJobs'],
    queryFn: fetchDelayedJobs,
    retry: 1, // Limitar reintentos
    staleTime: 30000, // 30 segundos
    refetchOnWindowFocus: false,
    onError: (error) => {
      console.error('Error en useDelayedJobs:', error)
    }
  })
} 