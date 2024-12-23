import { NextResponse } from 'next/server';
import { google } from 'googleapis';
import { getAuthClient } from '@/utils/googleAuth';
import { sheetIds } from '@/config/roles';

function categorizarFechaEntrega(fechaEntrega) {
  if (!fechaEntrega) return null;

  const fechaParsed = new Date(fechaEntrega);
  if (isNaN(fechaParsed.getTime())) return null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffDays = Math.floor((fechaParsed - today) / (1000 * 60 * 60 * 24));

  if (diffDays < -10) return 'moreThan10Days';
  if (diffDays < -6) return 'moreThan6Days';
  if (diffDays < -2) return 'moreThan2Days';
  if (diffDays === -2) return 'twoDays';
  if (diffDays === -1) return 'oneDay';
  if (diffDays === 0) return 'today';
  if (diffDays === 1) return 'tomorrow';
  if (diffDays === 2) return 'dayAfterTomorrow';
  return '3DaysOrMore';
}

export async function GET(request) {
  try {
    const auth = getAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetIds.status,
      range: 'A:F',
      valueRenderOption: 'FORMATTED_VALUE'
    });

    const rows = response.data.values || [];
    if (rows.length <= 1) return NextResponse.json({});

    const trabajosEnDespacho = new Set();
    const trabajosDigitacion = new Map();

    // Una sola pasada por los datos - O(n)
    for (let i = 1; i < rows.length; i++) {
      const [numero, fecha, area, estado, usuario, fechaEntrega] = rows[i];
      if (!numero) continue;

      // Convertir fecha una sola vez
      const fechaObj = new Date(fecha);
      const timestamp = fechaObj.getTime();

      if (estado === 'En despacho' || estado === 'Despacho - En despacho') {
        trabajosEnDespacho.add(numero);
        continue;
      }

      if (!trabajosDigitacion.has(numero)) {
        trabajosDigitacion.set(numero, {
          fechaEntrega,
          tieneDigitacion: false,
          ultimoEstado: { fecha: timestamp, area, estado, usuario },
          primerRegistro: { fecha, usuario },
          estados: []
        });
      }

      const info = trabajosDigitacion.get(numero);
      
      // Actualizar último estado si la fecha es más reciente
      if (timestamp > new Date(info.ultimoEstado.fecha).getTime()) {
        info.ultimoEstado = { fecha: timestamp, area, estado, usuario };
      }

      info.estados.push({ fecha, area, estado, usuario });

      if (estado === 'Digitacion') {
        info.tieneDigitacion = true;
      }
    }

    // Procesar y agrupar trabajos - O(n)
    const trabajosAgrupados = {};

    trabajosDigitacion.forEach((info, numero) => {
      // Verificar si algún estado en el historial es "Digitacion"
      const tuvoDigitacion = info.estados.some(estado => estado.estado === 'Digitacion');
      
      // Verificar si algún estado en el historial es despacho
      const tuvoDespacho = info.estados.some(estado => 
        estado.estado === 'En despacho' || estado.estado === 'Despacho - En despacho'
      );
      
      if (!tuvoDigitacion || tuvoDespacho) return;

      const categoria = categorizarFechaEntrega(info.fechaEntrega);
      if (!categoria) return;

      const trabajo = {
        number: numero,
        entryDate: info.primerRegistro.fecha,
        deliveryDate: info.fechaEntrega,
        user: info.ultimoEstado.usuario,
        status: info.ultimoEstado.estado,
        historial: info.estados
      };

      const { estado, area } = info.ultimoEstado;

      if (!trabajosAgrupados[estado]) {
        trabajosAgrupados[estado] = {
          area,
          jobs: {}
        };
      }

      if (!trabajosAgrupados[estado].jobs[categoria]) {
        trabajosAgrupados[estado].jobs[categoria] = [];
      }

      trabajosAgrupados[estado].jobs[categoria].push(trabajo);
    });

    return NextResponse.json(trabajosAgrupados);
  } catch (error) {
    console.error('Error en API de producción:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud', details: error.message },
      { status: 500 }
    );
  }
} 