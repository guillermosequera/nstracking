'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { getUserRole } from '@/config/roles'
import AdminRRHHView from '@/components/AdminRRHHView'

export default function AdminRRHHPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      const userRole = getUserRole(session.user.email)
      if (userRole !== 'adminRRHH') {
        console.log('User is not adminRRHH, redirecting')
        router.push('/')
      }
    } else if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, session, router])

  if (status === 'loading') {
    return <div>Cargando...</div>
  }

  if (!session || getUserRole(session.user.email) !== 'adminRRHH') {
    return null
  }

  return <AdminRRHHView />
}