import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchDelayedJobs } from '@/utils/jobUtils'

export function useDelayedJobs() {
  const queryClient = useQueryClient()
  
  // Configuración principal de la query
  const query = useQuery({
    queryKey: ['delayedJobs'],
    queryFn: fetchDelayedJobs,
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutos antes de considerar los datos obsoletos
    cacheTime: 10 * 60 * 1000, // 10 minutos de caché
    refetchOnWindowFocus: true, // Permitir actualización al volver a la ventana
    refetchOnMount: true, // Actualizar al montar el componente
    onError: (error) => {
      console.error('Error en useDelayedJobs:', error)
    }
  })

  // Función mejorada de refetch
  const refetch = async () => {
    try {
      // Primero invalidamos la query actual
      await queryClient.invalidateQueries({
        queryKey: ['delayedJobs'],
        refetchType: 'active', // Solo recargar queries activas
      })

      // Forzamos una nueva obtención de datos
      const result = await queryClient.fetchQuery({
        queryKey: ['delayedJobs'],
        queryFn: fetchDelayedJobs,
        staleTime: 0, // Forzar obtención de datos frescos
      })

      // Actualizamos el cache con los nuevos datos
      queryClient.setQueryData(['delayedJobs'], result)

      return { data: result }
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