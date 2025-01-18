'use client'
// nstracking/src/components/DelayedJobsList.js
import { useState, useMemo, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/Button'
import useSWR from 'swr'
import { fetchDelayedJobs } from '@/utils/jobUtils'
import { useDate } from '@/hooks/useDate'
import { DATE_FORMATS } from '@/hooks/useDate/constants'
import { RefreshCw } from 'lucide-react'
import LoadingState from '@/components/LoadingState'
import ErrorState from '@/components/ErrorState'
import EmptyState from '@/components/EmptyState'

const ITEMS_PER_PAGE = 100

// Función para determinar el color según días de atraso
const getJobColor = (delayDays) => {
  if (delayDays > 10) return 'bg-rose-900/90'
  if (delayDays > 6) return 'bg-rose-800/90'
  if (delayDays > 2) return 'bg-rose-700/90'
  if (delayDays === 2) return 'bg-rose-600/90'
  return 'bg-rose-500/90'
}

export default function DelayedJobsList() {
  const { data, error, isLoading, mutate } = useSWR('/api/delayed-jobs', fetchDelayedJobs, {
    refreshInterval: 30000,
    revalidateOnFocus: false,
    dedupingInterval: 5000,
    onSuccess: (data) => {
      console.log('✅ Datos de trabajos atrasados actualizados:', {
        timestamp: data.timestamp,
        totalAtrasados: data.data.length,
        metadata: data.metadata
      });
    },
    onError: (err) => {
      console.error('❌ Error al actualizar trabajos atrasados:', err);
    }
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [displayedJobs, setDisplayedJobs] = useState([]);
  const [jobsToShow, setJobsToShow] = useState(10);

  useEffect(() => {
    if (data?.data) {
      const sortedJobs = [...data.data].sort((a, b) => b.delayDays - a.delayDays);
      setDisplayedJobs(sortedJobs.slice(0, jobsToShow));
    }
  }, [data, jobsToShow]);

  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      console.log('🔄 Iniciando actualización manual de trabajos atrasados...');
      
      const updatedData = await mutate();
      
      console.log('📊 Datos después de actualización:', {
        timestamp: updatedData.timestamp,
        totalRegistros: updatedData.metadata.totalRegistros,
        totalAtrasados: updatedData.metadata.totalAtrasados,
        actualizadoEn: updatedData.metadata.actualizadoEn
      });

    } catch (error) {
      console.error('❌ Error en actualización manual:', error);
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  }, [mutate]);

  const handleLoadMore = useCallback(() => {
    setJobsToShow(prev => prev + 10);
  }, []);

  if (error) {
    console.error('❌ Error en la vista de trabajos atrasados:', error);
    return <div>Error al cargar los datos</div>;
  }

  const hasMoreJobs = data?.data && displayedJobs.length < data.data.length;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Trabajos Atrasados</h2>
        <button
          onClick={handleRefresh}
          disabled={isRefreshing}
          className={`px-4 py-2 rounded ${
            isRefreshing ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-600'
          } text-white transition-colors duration-200`}
        >
          {isRefreshing ? 'Actualizando...' : 'Actualizar'}
        </button>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : (
        <>
          <div className="space-y-4">
            {displayedJobs.map((job, index) => (
              <JobCard key={`${job.id}-${index}`} job={job} />
            ))}
          </div>

          {hasMoreJobs && (
            <button
              onClick={handleLoadMore}
              className="mt-4 px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded transition-colors duration-200"
            >
              Cargar más
            </button>
          )}
        </>
      )}
    </div>
  );
}
