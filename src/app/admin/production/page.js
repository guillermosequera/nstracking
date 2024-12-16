'use client'

import { useQuery } from '@tanstack/react-query';
import AdminProductionView from '@/components/AdminProductionView';

export default function AdminProductionPage() {
  const { data: commerceJobs, isLoading: isLoadingCommerce } = useQuery({
    queryKey: ['workerCommerce'],
    queryFn: () => fetchJobs('workerCommerce'),
  });

  const { data: dispatchJobs, isLoading: isLoadingDispatch } = useQuery({
    queryKey: ['workerDispatch'],
    queryFn: () => fetchJobs('workerDispatch'),
  });

  const { data: statusData, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['status'],
    queryFn: () => fetchStatusData(),
  });

  if (isLoadingCommerce || isLoadingDispatch || isLoadingStatus) {
    return <div className="text-center text-gray-300">Cargando datos...</div>;
  }

  return (
    <AdminProductionView
      commerceJobs={commerceJobs}
      dispatchJobs={dispatchJobs}
      statusData={statusData}
    />
  );
}