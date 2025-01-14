import { useQuery } from '@tanstack/react-query'
import { fetchProductionJobs } from '@/utils/jobUtils'

export function useProductionJobs() {
  const { data: trabajosAgrupados = {}, isLoading, error, refetch } = useQuery({
    queryKey: ['production-jobs'],
    queryFn: async () => {
      console.log('Iniciando fetch de trabajos de producción...')
      const response = await fetchProductionJobs()
      console.log('Respuesta completa:', response)
      console.log('Estructura de datos recibida:', {
        tieneData: !!response.data,
        tipoData: typeof response.data,
        estructuraData: response.data ? Object.keys(response.data) : 'sin datos'
      })
      return response.data || {}
    },
    retry: 3,
    refetchOnWindowFocus: false,
    staleTime: 0,
    cacheTime: 0,
    enabled: true
  })

  return {
    trabajosAgrupados,
    isLoading,
    error,
    refetch
  }
} 