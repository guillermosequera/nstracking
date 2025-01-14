import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchProductionJobs } from '@/utils/jobUtils'
import { productionQueryConfig, queryUtils } from '@/config/queryConfig'

export function useProductionJobs() {
  const queryClient = useQueryClient()
  
  const { data: trabajosAgrupados = {}, isLoading, error, refetch } = useQuery({
    queryKey: queryUtils.generateQueryKey('production'),
    queryFn: async () => {
      console.log('🔄 Iniciando fetch de trabajos de producción...')
      const response = await fetchProductionJobs()
      
      console.log('📦 Respuesta raw:', {
        tipo: typeof response,
        esObjeto: response instanceof Object,
        tieneData: Boolean(response?.data),
        keys: Object.keys(response || {}),
        timestamp: new Date().toISOString()
      })

      // Contar total de trabajos
      let totalTrabajos = 0
      if (response && typeof response === 'object') {
        if (response.data) {
          Object.values(response.data).forEach(area => {
            if (area.jobs) {
              Object.values(area.jobs).forEach(jobList => {
                totalTrabajos += Array.isArray(jobList) ? jobList.length : 0
              })
            }
          })
        } else {
          Object.values(response).forEach(area => {
            if (area.jobs) {
              Object.values(area.jobs).forEach(jobList => {
                totalTrabajos += Array.isArray(jobList) ? jobList.length : 0
              })
            }
          })
        }
      }
      
      console.log('📊 Estadísticas de trabajos:', {
        totalTrabajos,
        timestamp: new Date().toISOString()
      })
      
      // Si la respuesta ya es el objeto de trabajos agrupados, usarlo directamente
      if (response && typeof response === 'object' && !response.data && Object.keys(response).length > 0) {
        console.log('✅ Usando respuesta directamente')
        return response
      }
      
      // Si la respuesta tiene estructura {data, timestamp}
      if (response && response.data) {
        console.log('✅ Extrayendo datos de response.data')
        return response.data
      }
      
      console.log('⚠️ No se encontraron datos válidos en la respuesta')
      return {}
    },
    ...productionQueryConfig,
    staleTime: 0,
    cacheTime: 1000 * 30, // Reducido a 30 segundos
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  })

  const forceRefresh = async () => {
    console.log('🔄 Forzando actualización de trabajos de producción...')
    
    // Obtener datos actuales del caché
    const datosAnteriores = queryClient.getQueryData(queryUtils.generateQueryKey('production'))
    console.log('📦 Datos en caché antes del refresh:', {
      tipo: typeof datosAnteriores,
      keys: Object.keys(datosAnteriores || {}),
      timestamp: new Date().toISOString()
    })
    
    // Invalidar el caché actual
    await queryClient.invalidateQueries({
      queryKey: queryUtils.generateQueryKey('production'),
      refetchType: 'active',
      exact: true
    })
    
    // Realizar el refetch
    const result = await refetch()
    
    // Comparar datos
    const datosNuevos = result.data
    console.log('📊 Comparación de datos:', {
      datosAnterioresKeys: Object.keys(datosAnteriores || {}),
      datosNuevosKeys: Object.keys(datosNuevos || {}),
      cambio: JSON.stringify(datosAnteriores) !== JSON.stringify(datosNuevos),
      timestamp: new Date().toISOString()
    })
    
    return result
  }

  return {
    trabajosAgrupados,
    isLoading,
    error,
    refetch: forceRefresh
  }
} 