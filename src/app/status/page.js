'use client'

import { useSession } from 'next-auth/react';
import { getUserRole, workerRoles } from '@/config/roles';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';

export default function StatusPage() {
  const { data: session, status } = useSession();

  if (status === 'loading') return <p>Loading...</p>;
  if (!session) return <p>Not signed in</p>;

  const userRole = getUserRole(session.user.email);

  return (
    <div>
      <h1>Work Status Page</h1>
      <p>Signed in as {session.user.email}</p>
      <p>Role: {userRole || 'No role assigned'}</p>
      <LogoutButton />

      {userRole === 'admin' && (
        <div>
          <h2>Admin Links</h2>
          <Link href="/admin">Go to Admin Page</Link>
        </div>
      )}

      {(userRole === 'admin' || workerRoles.includes(userRole)) && (
        <div>
          <h2>Worker Pages</h2>
          <ul>
            {workerRoles.map(role => (
              <li key={role}>
                <Link href={`/${role.toLowerCase()}`}>
                  Go to {role.replace('worker', '')} Page
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Aquí puedes agregar la lógica para mostrar el estado de los trabajos */}
      <h2>Work Status</h2>
      <p>Display work status information here...</p>
    </div>
  );
}