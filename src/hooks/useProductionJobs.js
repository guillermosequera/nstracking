import { useQuery } from '@tanstack/react-query'
import { fetchProductionJobs } from '@/utils/jobUtils'

export function useProductionJobs() {
  const { data: trabajosAgrupados = {}, isLoading, error, refetch } = useQuery({
    queryKey: ['production-jobs'],
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