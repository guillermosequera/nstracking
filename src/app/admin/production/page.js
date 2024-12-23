'use client'

import { useQuery } from '@tanstack/react-query';
import AdminProductionView from '@/components/AdminProductionView';

const fetchProductionData = async () => {
  const response = await fetch('/api/production', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
    next: { revalidate: 300 } // Revalidar cada 5 minutos
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al cargar los datos de producción');
  }

  return response.json();
};

export default function AdminProductionPage() {
  const { 
    data, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['production-data'],
    queryFn: fetchProductionData,
    staleTime: 1000 * 60 * 4, // Considerar datos frescos por 4 minutos
    cacheTime: 1000 * 60 * 5, // Mantener en caché por 5 minutos
    refetchOnWindowFocus: false, // No recargar al cambiar de ventana
    retry: 2, // Intentar máximo 2 veces si falla
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <div className="text-blue-600">Cargando datos de producción...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-500">
          <div className="text-xl mb-2">Error al cargar los datos</div>
          <div className="text-sm">{error.message}</div>
          <button 
            onClick={() => refetch()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-gray-300">
          No hay datos disponibles
        </div>
      </div>
    );
  }

  return (
    <AdminProductionView
      trabajosAgrupados={data}
      onRefresh={refetch}
    />
  );
}