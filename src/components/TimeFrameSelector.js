// src/components/TimeFrameSelector.js
import React, { useMemo } from 'react';
import { Button } from '@/components/ui/Button';
//import { useTheme } from 'next-themes';

const timeFrames = [
  { key: 'today', label: 'Hoy' },
  { key: 'yesterday', label: 'Ayer' },
  { key: 'twoDaysAgo', label: 'Antes de Ayer' },
  { key: 'week', label: 'Esta Semana' },
  { key: 'month', label: 'Este Mes' },
  { key: 'lastMonth', label: 'Mes Pasado' }
];

// Hook personalizado para pre-filtrar datos
export function useTimeFrameData(data, activeTimeFrame) {
  const filteredData = useMemo(() => {
    if (!data || !Array.isArray(data)) return {};
    
    const [headers, ...rows] = data;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(today.getDate() - 2);

    const weekAgo = new Date(today);
    weekAgo.setDate(today.getDate() - 7);

    const monthAgo = new Date(today);
    monthAgo.setMonth(today.getMonth() - 1);

    const startLastMonth = new Date(today);
    startLastMonth.setMonth(today.getMonth() - 2);
    startLastMonth.setDate(1);
    
    const endLastMonth = new Date(today);
    endLastMonth.setMonth(today.getMonth() - 1);
    endLastMonth.setDate(0);

    // Pre-calculamos todos los filtros
    const filtered = {
      all: rows,
      today: [],
      yesterday: [],
      twoDaysAgo: [],
      week: [],
      month: [],
      lastMonth: []
    };

    // Filtramos una sola vez por cada fila
    rows.forEach(row => {
      if (!row[1]) return;
      
      const jobDate = new Date(row[1]);
      if (isNaN(jobDate.getTime())) return;
      
      const jobDateStart = new Date(jobDate);
      jobDateStart.setHours(0, 0, 0, 0);
      const timestamp = jobDateStart.getTime();

      // Clasificamos en cada categoría
      if (timestamp === today.getTime()) {
        filtered.today.push(row);
      }
      if (timestamp === yesterday.getTime()) {
        filtered.yesterday.push(row);
      }
      if (timestamp === twoDaysAgo.getTime()) {
        filtered.twoDaysAgo.push(row);
      }
      if (jobDateStart >= weekAgo && jobDateStart <= today) {
        filtered.week.push(row);
      }
      if (jobDateStart >= monthAgo && jobDateStart <= today) {
        filtered.month.push(row);
      }
      if (jobDateStart >= startLastMonth && jobDateStart <= endLastMonth) {
        filtered.lastMonth.push(row);
      }
    });

    return filtered;
  }, [data]);

  // Retornamos los datos del timeframe activo
  return filteredData[activeTimeFrame] || [];
}

export default function TimeFrameSelector({ activeTimeFrame, setActiveTimeFrame, data }) {
  
  const filteredData = useTimeFrameData(data, activeTimeFrame);
  const totalJobs = filteredData.length;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 justify-center">
        {timeFrames.map(({ key, label }) => (
          <Button
            key={key}
            onClick={() => setActiveTimeFrame(key)}
            variant={activeTimeFrame === key ? "default" : "outline"}
            className={`transition-all shadow-xl duration-200 ${
              activeTimeFrame === key 
                ? "bg-blue-800" 
                : "bg-slate-300"
            }`}
          >
            {label}
          </Button>
        ))}
      </div>
      <div className={`text-center text-sm ${
        "text-slate-600"
      }`}>
        Total de trabajos: {totalJobs}
      </div>
    </div>
  );
}