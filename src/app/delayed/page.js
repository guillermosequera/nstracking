'use client'

import { useSession } from "next-auth/react"
import DelayedJobsList from '@/components/DelayedJobsList'
import { getUserRole } from '@/config/roles'

export default function DelayedPage() {
  const { data: session, status } = useSession()

  if (status === "loading") {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-white">Cargando...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-white">Acceso denegado</p>
      </div>
    )
  }

  const userRole = getUserRole(session.user.email)
  if (!userRole) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-white">No tienes permisos para ver esta página</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <DelayedJobsList />
    </div>
  )
} 