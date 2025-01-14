// nstracking/src/hooks/useDelayedJobs.js

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchDelayedJobs } from '@/utils/jobUtils'
import { delayedJobsQueryConfig, queryUtils } from '@/config/queryConfig'

export function useDelayedJobs() {
  const queryClient = useQueryClient()

  const { data: responseData, isLoading, error, refetch } = useQuery({
    queryKey: queryUtils.generateQueryKey('delayed-jobs'),
    queryFn: async () => {
      console.log('🔄 Iniciando fetch de trabajos atrasados...')
      try {
        const response = await fetchDelayedJobs()
        
        console.log('📦 Respuesta de trabajos atrasados:', {
          tipo: typeof response,
          tieneData: Boolean(response?.data),
          tieneMetadata: Boolean(response?.metadata),
          timestamp: response?.metadata?.timestamp || new Date().toISOString()
        })

        // Extraer los trabajos de la nueva estructura de respuesta
        const trabajos = response?.data || response || []

        // Análisis detallado de trabajos atrasados
        if (Array.isArray(trabajos)) {
          const estadisticas = trabajos.reduce((acc, trabajo) => {
            acc.totalDiasAtraso += trabajo.delayDays || 0
            acc.porEstado[trabajo.status] = (acc.porEstado[trabajo.status] || 0) + 1
            return acc
          }, { totalDiasAtraso: 0, porEstado: {} })

          console.log('📊 Estadísticas de trabajos atrasados:', {
            total: trabajos.length,
            promedioAtraso: trabajos.length ? (estadisticas.totalDiasAtraso / trabajos.length).toFixed(1) : 0,
            distribucionEstados: estadisticas.porEstado,
            timestamp: response?.metadata?.timestamp || new Date().toISOString()
          })
        }

        return trabajos
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
    cacheTime: 1000 * 30,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    refetchInterval: 60000 // Refetch automático cada minuto
  })

  const forceRefresh = async () => {
    console.log('🔄 Forzando actualización de trabajos atrasados...')
    
    // Obtener datos actuales del caché
    const datosAnteriores = queryClient.getQueryData(queryUtils.generateQueryKey('delayed-jobs'))
    console.log('📦 Datos en caché antes del refresh:', {
      cantidad: Array.isArray(datosAnteriores) ? datosAnteriores.length : 0,
      timestamp: new Date().toISOString()
    })
    
    // Invalidar el caché actual pero mantener los datos hasta que lleguen los nuevos
    await queryClient.invalidateQueries({
      queryKey: queryUtils.generateQueryKey('delayed-jobs'),
      refetchType: 'active',
      exact: true
    })
    
    // Realizar el refetch
    const result = await refetch()
    const datosNuevos = result.data
    
    // Comparar datos
    const cambios = {
      cantidadAnterior: Array.isArray(datosAnteriores) ? datosAnteriores.length : 0,
      cantidadNueva: Array.isArray(datosNuevos) ? datosNuevos.length : 0,
      huboActualizacion: JSON.stringify(datosAnteriores) !== JSON.stringify(datosNuevos),
      timestamp: new Date().toISOString()
    }
    
    console.log('📊 Comparación de datos:', cambios)
    
    return result
  }

  return {
    data: responseData,
    isLoading,
    error,
    refetch: forceRefresh
  }
} 