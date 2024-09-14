'use client'

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserRole, adminRoles, workerRoles } from '@/config/roles';

const roleRoutes = {
  admin: '/admin',
  adminProduction: '/admin/production',
  adminFinance: '/admin/finance',
  adminCommerce: '/admin/commerce',
  adminRRHH: '/admin/rrhh',
  adminAdmin: '/admin',
  workerWareHouse: '/worker/warehouse',
  workerCommerce: '/worker/commerce',
  workerQuality: '/worker/quality',
  workerLabs: '/worker/labs',
  workerMontage: '/worker/montage',
  workerDispatch: '/worker/dispatch',
};

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.email) {
      const userRole = getUserRole(session.user.email);
      console.log("User role:", userRole);
      
      if (userRole && roleRoutes[userRole]) {
        router.push(roleRoutes[userRole]);
      } else {
        console.log("No role assigned or invalid role. Staying on home page.");
      }
    }
  }, [status, session, router]);

  if (status === "loading") {
    return <p>Cargando...</p>;
  }

  if (!session) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Bienvenido a nuestro sistema de seguimiento de trabajos</h1>
        <button 
          onClick={() => signIn('google')} 
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
        >
          Iniciar sesión con Google
        </button>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Bienvenido a nuestro sistema de seguimiento de trabajos</h1>
      <p className="mb-2">Conectado como {session.user.email}</p>
      <p className="mb-4">Rol: {getUserRole(session.user.email) || 'No asignado'}</p>
      <button 
        onClick={() => signOut()} 
        className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 mb-4"
      >
        Cerrar sesión
      </button>
      <h2 className="text-xl font-semibold mt-4 mb-2">Enlaces de navegación</h2>
      <ul className="list-disc pl-5">
        <li><Link href="/status" className="text-blue-500 hover:underline">Página de Estado</Link></li>
        <li><Link href="/admin" className="text-blue-500 hover:underline">Admin Dashboard</Link></li>
        <li><Link href="/worker/montage" className="text-blue-500 hover:underline">Worker Montage Dashboard</Link></li>
      </ul>
    </div>
  );
}