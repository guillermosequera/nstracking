// Ruta: src/app/page.js
'use client'

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { useState, useEffect } from 'react';
export default function Home() {

  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      console.log("User is not authenticated");
    }
  }, [status]);

  if (status === "loading") {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <h1>Bienvenido a nuestro sistema de seguimiento de trabajos</h1>
      {session ? (
        <>
          <p>Signed in as {session.user.email}</p>
          <button onClick={() => signOut()}>Sign out</button>
        </>
      ) : (
        <button onClick={() => signIn('google')}>Sign in with Google</button>
      )}
      <h2>Test Links</h2>
        <ul>
          <li><Link href="/status">Pagina Status</Link></li>
          <li><Link href="/admin/production">Admin Produccion</Link></li>
          <li><Link href="/admin/finance">Admin Finanzas</Link></li>
          <li><Link href="/worker/warehouse">Pagina Status</Link></li>
          <li><Link href="/worker/commerce">Pagina Status</Link></li>
          <li><Link href="/developer/stats">Pagina Status</Link></li>
        </ul>
    </div>
  );
}