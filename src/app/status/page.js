// src/app/status/page.js
'use client'

import { useSession } from 'next-auth/react';
import { getUserRole, adminRoles, workerRoles } from '@/config/roles';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';
import StatusView from '@/components/StatusView';

export default function StatusPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">Cargando...</div>;
  if (!session) return <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">No has iniciado sesión</div>;

  const userRole = getUserRole(session.user.email);

  const getWorkerPageLink = (role) => {
    switch(role) {
      case 'workerWareHouse':
        return '/worker/warehouse';
      case 'workerMontage':
        return '/worker/montage';
      default:
        return `/worker/${role.toLowerCase().replace('worker', '')}`;
    }
  };
  
  return (
    <div className="min-h-screen bg-black text-gray-100">
      <header className="bg-gray-800 py-4 px-8">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-800">Estado de Trabajo</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm">
              {session.user.email} ({userRole || 'No asignado'})
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <nav className="bg-gray-900 py-2">
        <div className="max-w-6xl mx-auto px-8">
          <ul className="flex justify-between">
            <li>
              <Link href="/" className="text-blue-500 hover:underline">
                Página Principal
              </Link>
            </li>
            {adminRoles.includes(userRole) && (
              <li>
                <Link href="/admin" className="text-blue-500 hover:underline">
                  Administración
                </Link>
              </li>
            )}
            {workerRoles.includes(userRole) && (
              <li>
                <Link href={getWorkerPageLink(userRole)} className="text-blue-500 hover:underline">
                  Tu Área de Trabajo
                </Link>
              </li>
            )}
            <li>
              <Link href="/status" className="text-blue-500 hover:underline">
                Status Job
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto mt-8 px-8">
        <StatusView />
      </main>
    </div>
  );
}