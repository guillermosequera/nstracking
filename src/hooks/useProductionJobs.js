import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchProductionJobs } from '@/utils/jobUtils'
import { productionQueryConfig, queryUtils } from '@/config/queryConfig'

export function useProductionJobs() {
  const queryClient = useQueryClient()
  
  const { data: responseData, isLoading, error, refetch } = useQuery({
    queryKey: queryUtils.generateQueryKey('production'),
    queryFn: async () => {
      console.log('🔄 Iniciando fetch de trabajos de producción...')
      const response = await fetchProductionJobs()
      
      console.log('📦 Respuesta raw:', {
        tipo: typeof response,
        tieneData: Boolean(response?.data),
        tieneMetadata: Boolean(response?.metadata),
        timestamp: response?.metadata?.timestamp || new Date().toISOString()
      })

      // Extraer los trabajos de la nueva estructura de respuesta
      const trabajosAgrupados = response?.data || response || {}

      // Contar total de trabajos
      let totalTrabajos = 0
      Object.values(trabajosAgrupados).forEach(area => {
        if (area.jobs) {
          Object.values(area.jobs).forEach(jobList => {
            totalTrabajos += Array.isArray(jobList) ? jobList.length : 0
          })
        }
      })
      
      console.log('📊 Estadísticas de trabajos:', {
        totalTrabajos,
        porEstado: Object.entries(trabajosAgrupados).reduce((acc, [estado, data]) => {
          acc[estado] = Object.values(data.jobs || {}).reduce((sum, jobs) => 
            sum + (Array.isArray(jobs) ? jobs.length : 0), 0
          )
          return acc
        }, {}),
        timestamp: response?.metadata?.timestamp || new Date().toISOString()
      })

      return trabajosAgrupados
    },
    ...productionQueryConfig,
    staleTime: 0,
    cacheTime: 1000 * 30,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000 // Refetch automático cada minuto
  })

  const forceRefresh = async () => {
    console.log('🔄 Forzando actualización de trabajos de producción...')
    
    // Obtener datos actuales del caché
    const datosAnteriores = queryClient.getQueryData(queryUtils.generateQueryKey('production'))
    const totalAnterior = contarTotalTrabajos(datosAnteriores)
    
    console.log('📦 Datos en caché antes del refresh:', {
      totalTrabajos: totalAnterior,
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
    const datosNuevos = result.data
    const totalNuevo = contarTotalTrabajos(datosNuevos)
    
    // Comparar datos
    const cambios = {
      totalAnterior,
      totalNuevo,
      huboActualizacion: JSON.stringify(datosAnteriores) !== JSON.stringify(datosNuevos),
      timestamp: new Date().toISOString()
    }
    
    console.log('📊 Comparación de datos:', cambios)
    
    // Si no hubo cambios, forzar una actualización del caché
    if (!cambios.huboActualizacion) {
      console.log('⚠️ No se detectaron cambios, forzando actualización del caché...')
      await queryClient.resetQueries(queryUtils.generateQueryKey('production'))
    }
    
    return result
  }

  // Función auxiliar para contar total de trabajos
  const contarTotalTrabajos = (datos) => {
    if (!datos || typeof datos !== 'object') return 0
    
    return Object.values(datos).reduce((total, area) => {
      if (!area.jobs) return total
      return total + Object.values(area.jobs).reduce((sum, jobs) => 
        sum + (Array.isArray(jobs) ? jobs.length : 0), 0
      )
    }, 0)
  }

  return {
    trabajosAgrupados: responseData,
    isLoading,
    error,
    refetch: forceRefresh
  }
} 