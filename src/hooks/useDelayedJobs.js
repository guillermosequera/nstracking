// nstracking/src/hooks/useDelayedJobs.js

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchDelayedJobs } from '@/utils/jobUtils'
import { delayedJobsQueryConfig, queryUtils } from '@/config/queryConfig'

export function useDelayedJobs() {
  const queryClient = useQueryClient()

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryUtils.generateQueryKey('delayed-jobs'),
    queryFn: async () => {
      console.log('🔄 Iniciando fetch de trabajos atrasados...')
      try {
        const response = await fetchDelayedJobs()
        
        console.log('📦 Respuesta de trabajos atrasados:', {
          tipo: typeof response,
          esArray: Array.isArray(response),
          cantidad: Array.isArray(response) ? response.length : 0,
          timestamp: new Date().toISOString()
        })

        // Análisis detallado de trabajos atrasados
        if (Array.isArray(response)) {
          const estadisticas = response.reduce((acc, trabajo) => {
            acc.totalDiasAtraso += trabajo.delayDays || 0
            acc.porEstado[trabajo.estado] = (acc.porEstado[trabajo.estado] || 0) + 1
            return acc
          }, { totalDiasAtraso: 0, porEstado: {} })

          console.log('📊 Estadísticas de trabajos atrasados:', {
            total: response.length,
            promedioAtraso: response.length ? (estadisticas.totalDiasAtraso / response.length).toFixed(1) : 0,
            distribucionEstados: estadisticas.porEstado,
            timestamp: new Date().toISOString()
          })
        }

        return response
      } catch (error) {
        console.error('❌ Error al obtener trabajos atrasados:', {
          mensaje: error.message,
          timestamp: new Date().toISOString()
        })
        throw error
      }
    },
    ...delayedJobsQueryConfig,
    staleTime: 0,
    cacheTime: 1000 * 30, // Reducido a 30 segundos
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true
  })

  const forceRefresh = async () => {
    console.log('🔄 Forzando actualización de trabajos atrasados...')
    
    // Obtener datos actuales del caché
    const datosAnteriores = queryClient.getQueryData(queryUtils.generateQueryKey('delayed-jobs'))
    console.log('📦 Datos en caché antes del refresh:', {
      cantidad: Array.isArray(datosAnteriores) ? datosAnteriores.length : 0,
      timestamp: new Date().toISOString()
    })
    
    // Invalidar el caché actual
    await queryClient.invalidateQueries({
      queryKey: queryUtils.generateQueryKey('delayed-jobs'),
      refetchType: 'active',
      exact: true
    })
    
    // Realizar el refetch
    const result = await refetch()
    
    // Comparar datos
    const datosNuevos = result.data
    console.log('📊 Comparación de datos:', {
      cantidadAnterior: Array.isArray(datosAnteriores) ? datosAnteriores.length : 0,
      cantidadNueva: Array.isArray(datosNuevos) ? datosNuevos.length : 0,
      cambio: JSON.stringify(datosAnteriores) !== JSON.stringify(datosNuevos),
      timestamp: new Date().toISOString()
    })
    
    return result
  }

  return {
    data,
    isLoading,
    error,
    refetch: forceRefresh
  }
} 