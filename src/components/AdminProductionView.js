// nstracking/src/components/AdminProductionView.js

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useProductionJobs } from '../hooks/useProductionJobs';
import { useDate } from '@/hooks/useDate';
import { DATE_FORMATS } from '@/hooks/useDate/constants';
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
import SyncControl from '@/components/SyncControl';

const DELIVERY_COLUMNS = [
  { key: 'moreThan10Days', label: '+ 10 días', colorClass: 'text-red-200', bgColorClass: 'bg-red-400', dias: 10 },
  { key: 'moreThan6Days', label: '+ 6 días', colorClass: 'text-orange-500', bgColorClass: 'bg-red-300', dias: 6 },
  { key: 'moreThan2Days', label: '+ 2 días', colorClass: 'text-yellow-600', bgColorClass: 'bg-red-200', dias: 2 },
  { key: 'twoDays', label: 'Dos dias', colorClass: 'text-yellow-700', bgColorClass: 'bg-orange-200', dias: 2 },
  { key: 'oneDay', label: 'Un día', colorClass: 'text-green-600', bgColorClass: 'bg-yellow-100', dias: 1 },
  { key: 'today', label: 'Hoy', colorClass: 'text-green-600', bgColorClass: 'bg-yellow-50', dias: 0 },
  { key: 'tomorrow', label: 'Mañana', colorClass: 'text-green-700', bgColorClass: 'bg-green-100', dias: -1 },
  { key: 'dayAfterTomorrow', label: '+ 2 días', colorClass: 'text-green-800', bgColorClass: 'bg-green-50', dias: -2 },
  { key: '3DaysOrMore', label: '+ 3 dias', colorClass: 'text-gray-600', bgColorClass: 'bg-emerald-50', dias: -3 }
];

const STATE_PRIORITY = {

  // Comercial
  "Digitacion": 1,

  // Bodega
  "Bodega - Compras por quiebre": 2,
  "Bodega - Picking": 2,
  "Bodega - Stock armazon": 3,
  "Bodega - NV quiebre sin compra": 4,
  "Bodega - Quiebre por armazon": 4,
  "Fuera de Bodega": 5,
  
  
  // Laboratorio
  "Laboratorio - Superficie polimeros": 8,
  "Laboratorio - Superficie mineral": 9,
  "Laboratorio - Tratamiento": 10,
  "Laboratorio - Tratamiento AR": 11,
  "Laboratorio - Teñido": 12,
  "Laboratorio - Reparacion mineral": 13,
  "Laboratorio - Enviado a AR": 14,
  "Laboratorio - Recibido de AR": 15,
  
  // Montaje
  "Montaje - Montaje": 16,
  "Montaje - Reparacion": 16,
  "Fuera de Montaje": 17,

  // Control Calidad
  "Control Calidad - Control calidad": 18,
  "Garantia": 18,
  "fuera_de_control_de_calidad": 18,

  // Merma
  "Merma - Merma antireflejo": 19,
  "Merma - Merma laboratorio": 19,
  "Merma - Merma teñido": 19,
  "Merma - Merma Montaje": 19,
  "Merma - Merma bodega": 19,
  "Merma - Merma comercial": 19,
  "merma_comercial": 19,
  "Merma - Merma material": 19,
  "Merma - Merma proveedor": 19,
  "Merma - Merma sistema": 19,
  
  // Despacho
  "En despacho": 20,
  "Fuera de Despacho": 20,
  "Despacho - En despacho": 20,
  "Despacho - Despachado": 20,
  
  // Tienda
  "Recepcion tienda": 21,
  "Entregado al cliente": 21,


  // Otros
  "Estado Desconocido": 30
};

export default function AdminProductionView() {
  const [selectedCell, setSelectedCell] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data: session } = useSession();
  const { parseDate, formatDate, toChileTime } = useDate();
  const { trabajosAgrupados = {}, isLoading, error, refetch } = useProductionJobs();

  console.log('AdminProductionView - trabajosAgrupados recibidos:', {
    tipo: typeof trabajosAgrupados,
    esObjeto: trabajosAgrupados instanceof Object,
    keys: Object.keys(trabajosAgrupados),
    hayDatos: Object.keys(trabajosAgrupados).length > 0
  });

  // Función para determinar la categoría de entrega basada en días hábiles
  const determinarCategoriaEntrega = useCallback((trabajo) => {
    if (!trabajo || trabajo.diasHabilesAtraso === undefined || trabajo.diasHabilesAtraso === null) {
      console.log(`No se puede determinar categoría para trabajo ${trabajo?.number}: sin días de atraso`);
      return null;
    }

    const diasAtraso = trabajo.diasHabilesAtraso;
    console.log(`Determinando categoría para trabajo ${trabajo.number}: ${diasAtraso} días de atraso`);

    // Categorías para trabajos atrasados (días positivos)
    if (diasAtraso > 10) return 'moreThan10Days';
    if (diasAtraso > 6) return 'moreThan6Days';
    if (diasAtraso > 2) return 'moreThan2Days';
    if (diasAtraso === 2) return 'twoDays';
    if (diasAtraso === 1) return 'oneDay';
    
    // Categoría para el día actual
    if (diasAtraso === 0) return 'today';
    
    // Categorías para trabajos futuros (días negativos)
    if (diasAtraso === -1) return 'tomorrow';
    if (diasAtraso === -2) return 'dayAfterTomorrow';
    if (diasAtraso < -2) return '3DaysOrMore';
    
    // Si por alguna razón no cae en ninguna categoría
    console.log(`Trabajo ${trabajo.number}: No se pudo categorizar (${diasAtraso} días)`);
    return null;
  }, []);

  // Procesar y categorizar trabajos
  const trabajosProcesados = useMemo(() => {
    const resultado = {};
    
    // Si no hay datos, retornar objeto vacío
    if (!trabajosAgrupados) {
      return resultado;
    }
    
    Object.entries(trabajosAgrupados).forEach(([estado, data]) => {
      if (!resultado[estado]) {
        resultado[estado] = {
          area: data.area,
          jobs: {}
        };
      }

      // Inicializar todas las categorías
      DELIVERY_COLUMNS.forEach(column => {
        resultado[estado].jobs[column.key] = [];
      });

      // Procesar cada trabajo
      if (data.jobs) {
        Object.values(data.jobs).flat().forEach(trabajo => {
          const categoria = determinarCategoriaEntrega(trabajo);
          if (categoria) {
            resultado[estado].jobs[categoria].push(trabajo);
          }
        });
      }
    });

    return resultado;
  }, [trabajosAgrupados, determinarCategoriaEntrega]);

  // Función para formatear fechas con el hook useDate
  const formatDateDisplay = useCallback((dateString, includeTime = true) => {
    if (!dateString) return 'Fecha no disponible';
    
    const result = parseDate(dateString);
    if (result.error) return 'Fecha inválida';
    
    const chileDate = toChileTime(result.date);
    if (!chileDate) return 'Error de zona horaria';
    
    return formatDate(
      chileDate, 
      includeTime ? DATE_FORMATS.DISPLAY_WITH_TIME : DATE_FORMATS.DISPLAY_DATE_ONLY
    );
  }, [parseDate, formatDate, toChileTime]);

  // Ordenar estados por prioridad
  const estadosOrdenados = useMemo(() => {
    if (!trabajosAgrupados) return [];
    
    return Object.entries(trabajosAgrupados)
      .sort(([estadoA], [estadoB]) => {
        const prioridadA = STATE_PRIORITY[estadoA] || 999;
        const prioridadB = STATE_PRIORITY[estadoB] || 999;
        return prioridadA - prioridadB;
      });
  }, [trabajosAgrupados]);

  // Calcular el total de trabajos por estado
  const calcularTotal = useCallback((jobs) => {
    if (!jobs) return 0;
    
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
    
    setIsRefreshing(true);
    console.log('Iniciando actualización de datos de producción...');
    console.log('Estado actual de trabajosAgrupados:', {
      tipo: typeof trabajosAgrupados,
      keys: Object.keys(trabajosAgrupados),
      muestra: trabajosAgrupados
    });
    
    try {
      const result = await refetch();
      console.log('Resultado del refetch:', result);
      console.log('Nuevo estado después del refetch:', {
        tipo: typeof trabajosAgrupados,
        keys: Object.keys(trabajosAgrupados),
        muestra: trabajosAgrupados
      });
      
      // Validar si hay celda seleccionada y los datos existen
      if (selectedCell && trabajosAgrupados) {
        const { estado, categoria } = selectedCell;
        const estadoExiste = trabajosAgrupados[estado];
        console.log('Validando celda seleccionada:', { 
          estado, 
          categoria, 
          estadoExiste,
          estadosDisponibles: Object.keys(trabajosAgrupados)
        });
        if (!estadoExiste) {
          setSelectedCell(null);
        }
      }
    } catch (error) {
      console.error('Error durante el refetch:', error);
    } finally {
      setTimeout(() => {
        console.log('Estado final de trabajosAgrupados:', {
          tipo: typeof trabajosAgrupados,
          keys: Object.keys(trabajosAgrupados),
          muestra: trabajosAgrupados
        });
        setIsRefreshing(false);
      }, 1000);
    }
  }, [isRefreshing, refetch, selectedCell, trabajosAgrupados]);

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

  return (
    <div className="w-full max-w-[95vw] mx-auto space-y-4 p-2 sm:p-4 md:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <h1 className="text-xl sm:text-2xl font-bold text-blue-600">Trabajos en Producción</h1>
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isRefreshing}
              className="flex items-center gap-2 bg-slate-300 hover:bg-slate-700 text-blue-600 border-slate-600"
            >
              <RefreshCw 
                className={`h-3 w-3 sm:h-4 sm:w-4 ${isRefreshing ? 'animate-spin duration-1000' : ''}`}
              />
              <span className="text-xs sm:text-sm">{isRefreshing ? 'Actualizando...' : 'Actualizar'}</span>
            </Button>
            {/* <SyncControl variant="minimal" className="hidden"/> */}
          </div>
        </div>
        <div className="text-xs sm:text-sm text-blue-500">
          Total de trabajos: {totalGeneral}
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <Table className="w-full table-fixed">
          <TableHeader>
            <TableRow>
              <TableHead className="bg-gray-400 sticky left-0 z-20 whitespace-nowrap w-[220px] text-xs sm:text-sm py-2">
                Estado
              </TableHead>
              {DELIVERY_COLUMNS.map((column) => (
                <TableHead 
                  key={column.key} 
                  className="bg-white whitespace-nowrap text-center font-semibold text-xs sm:text-sm w-[90px] py-2 text-gray-500"
                >
                  {column.label}
                </TableHead>
              ))}
              <TableHead className="bg-white text-blue-800 font-bold text-center text-xs sm:text-sm w-[70px] py-2">
                Total
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Object.entries(trabajosProcesados)
              .sort(([estadoA], [estadoB]) => {
                const prioridadA = STATE_PRIORITY[estadoA] || 999;
                const prioridadB = STATE_PRIORITY[estadoB] || 999;
                return prioridadA - prioridadB;
              })
              .map(([estado, data]) => {
                const totalEstado = calcularTotal(data.jobs);
                return (
                  <TableRow key={estado}>
                    <TableCell className="font-medium sticky left-0 bg-gray-300 z-10 text-xs sm:text-sm whitespace-nowrap py-1.5">
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
                          className={`text-center cursor-pointer hover:bg-opacity-75 text-xs sm:text-sm py-1.5 ${
                            column.bgColorClass
                          } ${
                            column.colorClass
                          } ${
                            trabajos.length > 0 ? 'font-semibold' : ''
                          } ${
                            selectedCell?.estado === estado && selectedCell?.categoria === column.key
                              ? 'ring-2 ring-blue-400 ring-inset'
                              : ''
                          }`}
                          onClick={() => handleCellClick(estado, column.key)}
                        >
                          {trabajos.length > 0 ? trabajos.length : ''}
                        </TableCell>
                      );
                    })}
                    <TableCell 
                      className={`text-center font-bold text-blue-800 bg-white cursor-pointer hover:bg-blue-50 text-xs sm:text-sm py-1.5 ${
                        selectedCell?.estado === estado && selectedCell?.categoria === 'total'
                          ? 'ring-2 ring-blue-400 ring-inset'
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
        <div className="mt-4 sm:mt-6">
          <h3 className="text-base sm:text-lg font-semibold mb-3">
            Trabajos en estado &quot;{selectedCell.estado}&quot; {
              selectedCell.categoria === 'total' 
                ? '- Todos'
                : `- ${DELIVERY_COLUMNS.find(col => col.key === selectedCell.categoria).label}`
            }
          </h3>
          <ProductionJobsList 
            jobs={
              selectedCell.categoria === 'total'
                ? Object.values(trabajosProcesados[selectedCell.estado].jobs)
                  .flat()
                : trabajosProcesados[selectedCell.estado].jobs[selectedCell.categoria]
            }
            status={selectedCell.estado}
            category={selectedCell.categoria}
          />
        </div>
      )}
    </div>
  );
}