'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { getUserRole, workerRoles } from '@/config/roles'
import { getUserName } from '@/utils/userUtils'

export default function WorkerPageBase({ children }) {
  const { data: session, status } = useSession()
  const [error, setError] = useState('')

  if (status === 'loading') {
    return <div className="flex items-center justify-center">Cargando...</div>
  }
  
  if (!session) {
    return <div className="flex items-center justify-center">Acceso Denegado</div>
  }

  const userRole = getUserRole(session.user.email)
  if (!workerRoles.includes(userRole)) {
    return <div className="flex items-center justify-center">Acceso Denegado</div>
  }

  return (
    <div className="container mx-auto px-4">
      {error && (
        <div className="mt-4">
          <p className="text-red-500">{error}</p>
        </div>
      )}
      <main className="mt-4">
        {children}
      </main>
    </div>
  )
}