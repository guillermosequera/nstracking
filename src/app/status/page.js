// src/app/status/page.js
'use client'

import { useSession } from 'next-auth/react'
import StatusView from '@/components/StatusView'

export default function StatusPage() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Cargando...
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        No has iniciado sesión
      </div>
    )
  }

  return (
    <main className="pt-8">
      <StatusView />
    </main>
  )
}