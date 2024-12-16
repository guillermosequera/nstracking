import { useQuery } from '@tanstack/react-query'

export function useProductionMatrix() {
  const fetchMatrix = async () => {
    const response = await fetch('/api/production-matrix', {
      credentials: 'include'
    })
    if (!response.ok) {
      throw new Error('Error al cargar la matriz de producción')
    }
    return response.json()
  }

  return fetchMatrix
} 