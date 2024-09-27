'use client'

import { useSession } from 'next-auth/react'
import { userHasInventoryAccess } from '@/config/roles'
import InventoryView from '@/components/InventoryView'
import AccessDenied from '@/components/AccessDenied'

export default function InventoryPage() {
  const { data: session, status } = useSession()

  console.log('InventoryPage: Session status', status);
  console.log('InventoryPage: Session data', session);

  if (status === 'loading') {
    return <div>Loading...</div>
  }

  if (!session) {
    console.log('InventoryPage: No session');
    return <AccessDenied />
  }

  const hasAccess = userHasInventoryAccess(session.user.email);
  console.log('InventoryPage: Has inventory access', hasAccess);

  if (!hasAccess) {
    return <AccessDenied />
  }

  return <InventoryView />
}