'use client'

import { useSession } from 'next-auth/react';
import { getUserRole, adminRoles, workerRoles } from '@/config/roles';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';

export default function StatusPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <p>Cargando...</p>;
  if (!session) return <p>No has iniciado sesión</p>;

  const userRole = getUserRole(session.user.email);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Página de Estado de Trabajo</h1>
      <p className="mb-2">Conectado como: {session.user.email}</p>
      <p className="mb-4">Rol: {userRole || 'No asignado'}</p>
      <LogoutButton />

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Enlaces de Navegación</h2>
        <ul className="space-y-2">
          {adminRoles.includes(userRole) && (
            <li>
              <Link href="/admin" className="text-blue-500 hover:underline">
                Ir a la Página de Administración
              </Link>
            </li>
          )}
          {workerRoles.includes(userRole) && (
            <li>
              <Link href={`/worker/${userRole.toLowerCase().replace('worker', '')}`} className="text-blue-500 hover:underline">
                Ir a tu Página de Trabajo
              </Link>
            </li>
          )}
          <li>
            <Link href="/" className="text-blue-500 hover:underline">
              Volver a la Página Principal
            </Link>
          </li>
        </ul>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Estado del Trabajo</h2>
        <p>Aquí se mostrará la información sobre el estado del trabajo...</p>
      </div>
    </div>
  );
}