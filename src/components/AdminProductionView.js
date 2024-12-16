import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import JobTable from './JobTable';

export default function AdminProductionView() {
  const { data: commerceJobs, isLoading: isLoadingCommerce, error: errorCommerce } = useQuery({
    queryKey: ['workerCommerce'],
    queryFn: () => fetchJobs('workerCommerce'),
  });

  const { data: dispatchJobs, isLoading: isLoadingDispatch, error: errorDispatch } = useQuery({
    queryKey: ['workerDispatch'],
    queryFn: () => fetchJobs('workerDispatch'),
  });

  const { data: statusData, isLoading: isLoadingStatus, error: errorStatus } = useQuery({
    queryKey: ['status'],
    queryFn: () => statusData(),
  });

  const combinedData = useMemo(() => {
    if (!commerceJobs || !dispatchJobs || !statusData) return [];

    return commerceJobs.map(commerceJob => {
      const dispatchJob = dispatchJobs.find(dj => dj[0] === commerceJob[0]);
      const status = statusData.find(sd => sd[0] === commerceJob[0]);

      const deliveryDate = new Date(commerceJob[2]);
      const dispatchDate = dispatchJob ? new Date(dispatchJob[1]) : null;

      const isDelayed = dispatchDate && deliveryDate < dispatchDate;
      const lastStatus = status ? status[status.length - 1] : 'Desconocido';

      return {
        jobNumber: commerceJob[0],
        deliveryDate: deliveryDate.toLocaleString(),
        dispatchDate: dispatchDate ? dispatchDate.toLocaleString() : 'No Despachado',
        isDelayed,
        lastStatus,
      };
    });
  }, [commerceJobs, dispatchJobs, statusData]);

  if (isLoadingCommerce || isLoadingDispatch || isLoadingStatus) {
    return <div className="text-center text-gray-300">Cargando datos...</div>;
  }

  if (errorCommerce || errorDispatch || errorStatus) {
    return <div className="text-center text-red-500">Error al cargar los datos.</div>;
  }

  return (
    <div className="space-y-6 pb-16">
      <h2 className="text-2xl font-semibold mb-4">Vista de Producción</h2>
      <JobTable
        title="Estado de Producción"
        jobs={combinedData}
        columns={['Número de Trabajo', 'Fecha de Entrega', 'Fecha de Despacho', 'Retraso', 'Último Estado']}
      />
    </div>
  );
}