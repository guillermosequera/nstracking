import { useQuery } from '@tanstack/react-query'
import { fetchProductionJobs } from '@/utils/jobUtils'

export const useProductionJobs = () => {
  return useQuery({
    queryKey: ['production-jobs'],
    queryFn: async () => {
      console.log('Fetching production jobs...');
      try {
        const data = await fetchProductionJobs();
        return data;
      } catch (error) {
        console.error('Error fetching production jobs:', error);
        throw error;
      }
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
}; 