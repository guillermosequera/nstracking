'use client'

import SyncControl from '@/components/SyncControl';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <div>Cargando...</div>;
  }

  if (!session?.user?.isAdmin) {
    return <div>Acceso no autorizado</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Panel de Administración</h1>
      
      <div className="grid gap-6">
        <SyncControl />
        {/* Aquí puedes agregar más componentes de administración */}
      </div>
    </div>
  );
}