import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchProductionJobs } from '@/utils/jobUtils'
import { productionQueryConfig, queryUtils } from '@/config/queryConfig'

export function useProductionJobs() {
  const queryClient = useQueryClient()
  
  const { data: trabajosAgrupados = {}, isLoading, error, refetch } = useQuery({
    queryKey: queryUtils.generateQueryKey('production'),
    queryFn: async () => {
      console.log('Iniciando fetch de trabajos de producción...')
      const response = await fetchProductionJobs()
      
      console.log('Respuesta raw:', response)
      console.log('Tipo de respuesta:', typeof response)
      
      // Si la respuesta ya es el objeto de trabajos agrupados, usarlo directamente
      if (response && typeof response === 'object' && !response.data && Object.keys(response).length > 0) {
        console.log('Usando respuesta directamente:', response)
        return response
      }
      
      // Si la respuesta tiene estructura {data, timestamp}
      if (response && response.data) {
        console.log('Extrayendo datos de response.data:', response.data)
        return response.data
      }
      
      console.log('No se encontraron datos válidos en la respuesta')
      return {}
    },
    ...productionQueryConfig,
    staleTime: 0, // Forzar revalidación inmediata
    cacheTime: 1000 * 60, // Cache por 1 minuto
    refetchOnMount: true,
    refetchOnWindowFocus: true
  })

  const forceRefresh = async () => {
    console.log('Forzando actualización de trabajos de producción...')
    // Invalidar el caché actual
    await queryClient.invalidateQueries(queryUtils.generateQueryKey('production'))
    // Realizar el refetch
    const result = await refetch()
    console.log('Resultado del refetch forzado:', result)
    return result
  }

  return {
    trabajosAgrupados,
    isLoading,
    error,
    refetch: forceRefresh
  }
} 