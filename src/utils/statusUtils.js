// src/utils/statusUtils.js

import config from '@/config/statusConfig';  // Asumimos que existe este archivo de configuración

export function getStatusFromPage(activePage) {
  return config.statusMap[activePage] || 'Estado Desconocido';
}