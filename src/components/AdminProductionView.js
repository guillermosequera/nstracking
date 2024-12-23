import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useProductionJobs } from '@/hooks/useProductionJobs';
import { useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table.jsx";
import { Badge } from '@/components/ui/badge.js';
import { Button } from '@/components/ui/Button.js';
import { RefreshCw } from 'lucide-react';
import ProductionJobsList from './ProductionJobsList';
import LoadingState from '@/components/LoadingState';
import ErrorState from '@/components/ErrorState';

// Función para procesar fechas similar a delayed-jobs
function procesarFecha(fechaOriginal, numeroTrabajo) {
  if (!fechaOriginal) {
    console.log(`Trabajo ${numeroTrabajo}: Fecha vacía o nula`);
    return null;
  }

  // Asegurarnos de que la fecha se interprete como UTC
  const fechaParsed = new Date(fechaOriginal);
  const fechaUTC = new Date(Date.UTC(
    fechaParsed.getUTCFullYear(),
    fechaParsed.getUTCMonth(),
    fechaParsed.getUTCDate(),
    fechaParsed.getUTCHours(),
    fechaParsed.getUTCMinutes(),
    fechaParsed.getUTCSeconds()
  ));
  
  if (!isNaN(fechaUTC.getTime())) {
    return {
      fechaParaProcesar: fechaUTC,
      fechaParaMostrar: fechaUTC.toISOString(),
      fechaFormateada: `${String(fechaUTC.getUTCDate()).padStart(2, '0')}-${String(fechaUTC.getUTCMonth() + 1).padStart(2, '0')}-${fechaUTC.getUTCFullYear()}`
    };
  }
  
  console.log(`Trabajo ${numeroTrabajo}: Fecha inválida:`, fechaOriginal);
  return null;
}

// Función para calcular días hábiles entre fechas
function calcularDiasHabilesEntreFechas(fechaInicio, fechaFin) {
  let diasHabiles = 0;
  
  // Asegurarnos de que ambas fechas estén en UTC y al inicio del día
  const fechaInicioUTC = new Date(Date.UTC(
    fechaInicio.getUTCFullYear(),
    fechaInicio.getUTCMonth(),
    fechaInicio.getUTCDate()
  ));
  
  const fechaFinUTC = new Date(Date.UTC(
    fechaFin.getUTCFullYear(),
    fechaFin.getUTCMonth(),
    fechaFin.getUTCDate()
  ));
  
  const currentDate = new Date(fechaInicioUTC);
  
  while (currentDate <= fechaFinUTC) {
    const dia = currentDate.getUTCDay();
    if (dia !== 0 && dia !== 6) { // 0 = Domingo, 6 = Sábado
      diasHabiles++;
    }
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return diasHabiles;
}

const DELIVERY_COLUMNS = [
  { key: 'moreThan10Days', label: 'Más de 10 días', colorClass: 'text-red-500', dias: 10 },
  { key: 'moreThan6Days', label: 'Más de 6 días', colorClass: 'text-orange-500', dias: 6 },
  { key: 'moreThan2Days', label: 'Más de 2 días', colorClass: 'text-yellow-500', dias: 2 },
  { key: 'twoDays', label: 'Dos dias', colorClass: 'text-green-500', dias: 2 },
  { key: 'oneDay', label: 'Un día', colorClass: 'text-green-500', dias: 1 },
  { key: 'today', label: 'Hoy', colorClass: 'text-green-500', dias: 0 },
  { key: 'tomorrow', label: 'Para mañana', colorClass: 'text-green-500', dias: -1 },
  { key: 'dayAfterTomorrow', label: 'Para pasado mañana', colorClass: 'text-green-500', dias: -2 },
  { key: '3DaysOrMore', label: 'Para 3 días o más', colorClass: 'text-green-500', dias: -3 }
];

const AREA_PRIORITY = {
  commerce: 1,
  warehouse: 2,
  labs: 3,
  labsMineral: 4,
  labsAR: 5,
  montage: 6,
  quality: 7
};

export default function AdminProductionView() {
  const [selectedCell, setSelectedCell] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const { data: session } = useSession();

  const { data: trabajosAgrupados = {}, isLoading, error, refetch } = useProductionJobs();

  // Ordenar estados por área
  const estadosOrdenados = Object.entries(trabajosAgrupados)
    .sort(([, a], [, b]) => {
      const areaA = a.area.toLowerCase();
      const areaB = b.area.toLowerCase();
      
      const prioridadA = AREA_PRIORITY[areaA] || 999;
      const prioridadB = AREA_PRIORITY[areaB] || 999;
      
      return prioridadA - prioridadB;
    });

  // Calcular el total de trabajos por estado
  const calcularTotal = useCallback((jobs) => {
    return DELIVERY_COLUMNS.reduce((total, column) => {
      return total + (jobs[column.key]?.length || 0);
    }, 0);
  }, []);

  // Calcular el total general
  const totalGeneral = useMemo(() => {
    return estadosOrdenados.reduce((total, [_, data]) => {
      return total + calcularTotal(data.jobs);
    }, 0);
  }, [estadosOrdenados, calcularTotal]);

  const handleRefresh = useCallback(async () => {
    if (isRefreshing) return;
    
    const currentTotalJobs = totalGeneral;
    const currentSelectedCell = selectedCell;
    
    try {
      setIsRefreshing(true);
      
      // Crear una promesa que se resolverá después de un tiempo mínimo
      const minDelay = new Promise(resolve => setTimeout(resolve, 1000));
      
      // Ejecutar la actualización y esperar los resultados
      const [refreshResult] = await Promise.all([
        refetch(),
        minDelay
      ]);

      // Verificar si los datos se actualizaron correctamente
      if (!refreshResult || !refreshResult.data) {
        throw new Error('No se recibieron datos en la actualización');
      }

      const newData = refreshResult.data;
      
      // Calcular el nuevo total después de la actualización
      const newTotal = Object.values(newData).reduce((total, area) => {
        return total + Object.values(area.jobs || {}).flat().length;
      }, 0);

      // Comparar con los datos anteriores
      console.log(`Actualización completada:
        - Total trabajos anteriores: ${currentTotalJobs}
        - Total trabajos nuevos: ${newTotal}
        - Diferencia: ${newTotal - currentTotalJobs}
      `);

      // Verificar cambios por área
      Object.entries(newData).forEach(([area, data]) => {
        const totalArea = Object.values(data.jobs || {}).flat().length;
        console.log(`Área ${area}: ${totalArea} trabajos`);
      });

      // Si hay una celda seleccionada, verificar si aún existe en los nuevos datos
      if (currentSelectedCell) {
        const estadoExiste = newData[currentSelectedCell.estado];
        const categoriaExiste = currentSelectedCell.categoria === 'total' || 
          (estadoExiste?.jobs && estadoExiste.jobs[currentSelectedCell.categoria]?.length > 0);

        if (!estadoExiste || !categoriaExiste) {
          setSelectedCell(null);
          console.log('La selección actual ya no existe en los nuevos datos');
        }
      }
      
    } catch (error) {
      console.error('Error al actualizar:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [isRefreshing, totalGeneral, selectedCell, refetch]);

  // Auto-refresh cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh();
    }, 300000); // 5 minutos

    return () => clearInterval(interval);
  }, [handleRefresh]);

  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState error={error} />;

  const handleCellClick = (estado, categoria) => {
    setSelectedCell(prev => 
      prev?.estado === estado && prev?.categoria === categoria 
        ? null 
        : { estado, categoria }
    );
  };

  const handleTotalClick = (estado) => {
    setSelectedCell(prev => 
      prev?.estado === estado && prev?.categoria === 'total'
        ? null 
        : { estado, categoria: 'total' }
    );
  };

  // Función para determinar la categoría de entrega basada en la fecha
  const determinarCategoriaEntrega = (fechaEntrega) => {
    const fechaProcesada = procesarFecha(fechaEntrega);
    if (!fechaProcesada) return null;

    const today = new Date();
    const todayUTC = new Date(Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate()
    ));

    const diasHabiles = calcularDiasHabilesEntreFechas(todayUTC, fechaProcesada.fechaParaProcesar);

    // Determinar categoría basada en días hábiles
    if (diasHabiles > 10) return 'moreThan10Days';
    if (diasHabiles > 6) return 'moreThan6Days';
    if (diasHabiles > 2) return 'moreThan2Days';
    if (diasHabiles === 2) return 'twoDays';
    if (diasHabiles === 1) return 'oneDay';
    if (diasHabiles === 0) return 'today';
    if (diasHabiles === -1) return 'tomorrow';
    if (diasHabiles === -2) return 'dayAfterTomorrow';
    return '3DaysOrMore';
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-blue-600">Trabajos en Producción</h1>
          <Button
            onClick={handleRefresh}
            variant="outline"
            size="sm"
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-slate-300 hover:bg-slate-700 text-blue-600 border-slate-600"
          >
            <RefreshCw 
              className={`h-4 w-4 ${isRefreshing ? 'animate-spin duration-1000' : ''}`}
            />
            <span>{isRefreshing ? 'Actualizando...' : 'Actualizar'}</span>
          </Button>
        </div>
        <div className="text-sm text-blue-500">
          Total de trabajos: {totalGeneral}
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="bg-gray-400 sticky left-0 z-10">Estado</TableHead>
              {DELIVERY_COLUMNS.map((column) => (
                <TableHead 
                  key={column.key} 
                  className={`${column.colorClass} whitespace-nowrap bg-gray-400 text-center text-black`}
                >
                  {column.label}
                </TableHead>
              ))}
              <TableHead className="bg-blue-100 text-blue-800 font-bold text-center">
                Total
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {estadosOrdenados.map(([estado, data]) => {
              const totalEstado = calcularTotal(data.jobs);
              return (
                <TableRow key={estado}>
                  <TableCell className="font-medium sticky left-0 bg-gray-300 z-10">
                    <div className="flex items-center gap-2">
                      <span>{estado}</span>
                      <Badge variant="secondary" className="hidden">
                        {data.area}
                      </Badge>
                    </div>
                  </TableCell>
                  {DELIVERY_COLUMNS.map((column) => {
                    const trabajos = data.jobs[column.key] || [];
                    return (
                      <TableCell 
                        key={column.key}
                        className={`text-center cursor-pointer hover:bg-blue-300 ${
                          trabajos.length > 0 ? column.colorClass : 'text-gray-400'
                        } ${
                          selectedCell?.estado === estado && selectedCell?.categoria === column.key
                            ? 'bg-gray-200'
                            : ''
                        }`}
                        onClick={() => handleCellClick(estado, column.key)}
                      >
                        {trabajos.length}
                      </TableCell>
                    );
                  })}
                  <TableCell 
                    className={`text-center font-bold text-blue-800 bg-blue-50 cursor-pointer hover:bg-blue-100 ${
                      selectedCell?.estado === estado && selectedCell?.categoria === 'total'
                        ? 'bg-blue-100'
                        : ''
                    }`}
                    onClick={() => handleTotalClick(estado)}
                  >
                    {totalEstado}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {selectedCell && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold mb-4">
            Trabajos en estado &quot;{selectedCell.estado}&quot; {
              selectedCell.categoria === 'total' 
                ? '- Todos'
                : `- ${DELIVERY_COLUMNS.find(col => col.key === selectedCell.categoria).label}`
            }
          </h3>
          <ProductionJobsList 
            jobs={
              selectedCell.categoria === 'total'
                ? Object.values(trabajosAgrupados[selectedCell.estado].jobs)
                  .flat()
                : trabajosAgrupados[selectedCell.estado].jobs[selectedCell.categoria]
            }
            status={selectedCell.estado}
            category={selectedCell.categoria}
          />
        </div>
      )}
    </div>
  );
}