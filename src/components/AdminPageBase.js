'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { getUserRole, adminRoles } from '@/config/roles'
import Link from 'next/link'
import LogoutButton from './LogoutButton'

export default function AdminPageBase({ title, role, children }) {
  const { data: session, status } = useSession()
  const [error, setError] = useState('')

  if (status === 'loading') return <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">Cargando...</div>
  if (!session) return <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">Acceso Denegado</div>

  const userRole = getUserRole(session.user.email)
  if (!adminRoles.includes(userRole)) return <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">Acceso Denegado. Solo para administradores.</div>
  if (userRole !== role) return <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">Acceso Denegado. Solo para {role}.</div>

  return (
    <div className="min-h-screen bg-black text-gray-100">
      <header className="bg-gray-800 py-4 px-8">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-800">{title}</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm">
              {session.user.email} ({userRole})
            </span>
            <Link href="/status" className="text-blue-400 hover:underline text-sm">
              Estado
            </Link>
            <Link href="/admin" className="text-blue-400 hover:underline text-sm">
              Panel Admin
            </Link>
            <LogoutButton />
          </div>
        </div>
      </header>
      {error && (
        <div className="max-w-6xl mx-auto mt-4 px-8">
          <p className="text-red-500 mb-4">{error}</p>
        </div>
      )}
      <main className="max-w-6xl mx-auto mt-8 px-8">
        {children}
      </main>
    </div>
  )
}