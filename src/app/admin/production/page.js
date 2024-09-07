'use client'

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getUserRole } from '@/config/roles';
import Link from 'next/link';

export default function AdminProductionPage() {
    const { data: session, status } = useSession();
    const [sheetData, setSheetData] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        if (session) {
            fetchSheetData();
        }
    }, [session]);

    async function fetchSheetData() {
        try {
            const response = await fetch('/api/sheets?role=adminProduction');
            if (!response.ok) throw new Error('Failed to fetch');
            const data = await response.json();
            setSheetData(data);
            setError('');
        } catch (error) {
            console.error('Error fetching sheet data:', error);
            setError('Error fetching sheet data. Check console for details.');
        }
    }

    if (status === 'loading') return <p>Loading...</p>;

    if (!session) return <p>Access Denied</p>;

    const userRole = getUserRole(session.user.email);

    return (
        <div>
            <h1>Administrador de producción</h1>
            <p>Iniciado como {session.user.email}</p>
            <p>Rol: {userRole || 'No role assigned'}</p>
            <Link href="/status">Status</Link>

            {error && <p style={{ color: 'red' }}>{error}</p>}

            <h2>Datos de producción</h2>
            {sheetData.length > 0 ? (
                <ul>
                    {sheetData.map((data, index) => (
                        <li key={index}>{reportWebVitals.join(', ')}</li>
                    ))}
                </ul>
            ) : (
                <p>No hay datos para mostrar</p>
            )}
        </div>
    );
}
