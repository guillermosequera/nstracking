import { useQuery } from '@tanstack/react-query'
import { fetchProductionJobs } from '@/utils/jobUtils'

export function useProductionJobs() {
  return useQuery({
    queryKey: ['production-jobs'],
    queryFn: async () => {
      console.log('Fetching production jobs...');
      const data = await fetchProductionJobs();
      return data;
    },
    retry: 3,
    refetchOnWindowFocus: false,
    staleTime: 60000, // 1 minuto
    cacheTime: 120000, // 2 minutos
    refetchInterval: 300000, // 5 minutos
    onError: (error) => {
      console.error('Error en useProductionJobs:', error);
    },
    onSuccess: (data) => {
      console.log('Production jobs fetched successfully:', {
        totalEstados: Object.keys(data).length
      });
    }
  });
} 