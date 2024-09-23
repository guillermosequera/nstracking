// src/utils/cacheUtils.js
import NodeCache from 'node-cache';

// Crear una instancia de NodeCache con un tiempo de vida predeterminado de 5 minutos
const cache = new NodeCache({ stdTTL: 300 });

export function getCachedData(key) {
  return cache.get(key);
}

export function setCachedData(key, data) {
  cache.set(key, data);
}

export function clearCache() {
  cache.flushAll();
}