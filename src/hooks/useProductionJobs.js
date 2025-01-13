import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { fetchProductionJobs } from '@/utils/jobUtils'
import { productionQueryConfig, queryUtils, SHARED_CACHE_KEY } from '@/config/queryConfig'

export function useProductionJobs() {
  const queryClient = useQueryClient()
  const queryKey = queryUtils.generateQueryKey('production')
  
  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: async () => {
      console.log('Fetching production jobs...')
      try {
        const response = await fetchProductionJobs()
        
        // Extraer datos y timestamp de la respuesta
        const { data: trabajosAgrupados, timestamp } = response
        
        console.log('Production jobs fetched successfully:', {
          timestamp,
          totalEstados: Object.keys(trabajosAgrupados).length
        })

        // Actualizar el caché con los nuevos datos
        queryClient.setQueryData(queryKey, trabajosAgrupados)
        
        return trabajosAgrupados
      } catch (error) {
        console.error('Error fetching production jobs:', error)
        throw error
      }
    },
    ...productionQueryConfig
  })

  // Verificación periódica cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      console.log('Ejecutando verificación periódica de trabajos de producción')
      refetch()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [refetch])

  return { data, isLoading, error, refetch }
} 