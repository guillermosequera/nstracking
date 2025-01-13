import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchProductionJobs } from '@/utils/jobUtils'
import { productionQueryConfig, queryUtils, SHARED_CACHE_KEY } from '@/config/queryConfig'

export function useProductionJobs() {
  const queryClient = useQueryClient()
  const queryKey = queryUtils.generateQueryKey('production')
  
  console.log('useProductionJobs - Query Key:', queryKey)
  
  return useQuery({
    queryKey,
    queryFn: async () => {
      const timestamp = new Date().toISOString()
      console.log(`[${timestamp}] Iniciando fetch de trabajos de producción...`)
      console.log('Estado del caché antes del fetch:', {
        queryKey,
        cachedData: queryClient.getQueryData(queryKey)
      })

      try {
        console.log('Llamando a fetchProductionJobs...')
        const data = await fetchProductionJobs()
        
        console.log('Datos recibidos de fetchProductionJobs:', {
          totalEstados: Object.keys(data).length,
          estados: Object.keys(data)
        })

        // Invalidar el caché compartido
        console.log('Invalidando caché compartido...')
        await queryClient.invalidateQueries({
          queryKey: [SHARED_CACHE_KEY],
          exact: false,
          refetchType: 'none'
        })
        
        // Actualizar el caché con los nuevos datos
        console.log('Actualizando caché con nuevos datos...')
        queryClient.setQueryData(queryKey, data)
        
        console.log('Fetch completado exitosamente')
        return data
      } catch (error) {
        console.error('Error en fetchProductionJobs:', error)
        throw error
      }
    },
    ...productionQueryConfig,
    onSuccess: (data) => {
      console.log('Query completada con éxito:', {
        timestamp: new Date().toISOString(),
        totalEstados: Object.keys(data).length,
        estados: Object.keys(data)
      })
    },
    onError: (error) => {
      console.error('Error en la query:', error)
    }
  })
} 