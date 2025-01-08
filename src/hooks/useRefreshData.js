import { useQueryClient } from '@tanstack/react-query';

export function useRefreshData() {
  const queryClient = useQueryClient();

  const refreshAllData = async () => {
    try {
      // Invalidar y refrescar todas las queries relevantes
      await Promise.all([
        // Refrescar datos de producción
        queryClient.invalidateQueries(['production-data']),
        // Refrescar datos de trabajos atrasados
        queryClient.invalidateQueries(['delayed-jobs']),
        // Refrescar cualquier otra query relacionada
        queryClient.invalidateQueries(['production-jobs'])
      ]);

      // Forzar recálculo de datos
      await Promise.all([
        queryClient.refetchQueries(['production-data']),
        queryClient.refetchQueries(['delayed-jobs']),
        queryClient.refetchQueries(['production-jobs'])
      ]);

      return true;
    } catch (error) {
      console.error('Error al actualizar datos:', error);
      return false;
    }
  };

  return { refreshAllData };
}