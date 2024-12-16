'use client'

import { useSession } from 'next-auth/react'
import { getUserRole, workerRoles } from '@/config/roles'

export function withWorkerAuth(WrappedComponent, requiredRole) {
  return function WithWorkerAuthComponent(props) {
    const { data: session, status } = useSession()

    if (status === 'loading') {
      return <div className="flex items-center justify-center">Cargando...</div>
    }

    if (!session) {
      return <div className="flex items-center justify-center">Acceso Denegado</div>
    }

    const userRole = getUserRole(session.user.email)
    if (!workerRoles.includes(userRole) || userRole !== requiredRole) {
      return <div className="flex items-center justify-center">Acceso Denegado</div>
    }

    return <WrappedComponent {...props} />
  }
} 