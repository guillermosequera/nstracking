'use client'

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getUserRole, workerRoles } from '@/config/roles';
import Link from 'next/link';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [sheetData, setSheetData] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    if (session) {
      fetchAllSheetData();
    }
  }, [session]);

  async function fetchAllSheetData() {
    try {
      const allData = {};
      for (const role of workerRoles) {
        const response = await fetch(`/api/sheets?role=${role}`);
        if (!response.ok) throw new Error(`Failed to fetch ${role} data`);
        allData[role] = await response.json();
      }
      setSheetData(allData);
      setError('');
    } catch (error) {
      console.error('Error fetching sheet data:', error);
      setError('Error fetching sheet data. Check console for details.');
    }
  }

  if (status === 'loading') return <p>Loading...</p>;
  if (!session) return <p>Access Denied</p>;

  const userRole = getUserRole(session.user.email);
  if (userRole !== 'admin') return <p>Access Denied. Admin only.</p>;

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Signed in as {session.user.email}</p>
      <Link href="/status">Go to Status Page</Link>

      {error && <p style={{color: 'red'}}>{error}</p>}

      <h2>All Sheet Data</h2>
      {Object.entries(sheetData).map(([role, data]) => (
        <div key={role}>
          <h3>{role}</h3>
          {data.length > 0 ? (
            <ul>
              {data.map((row, index) => (
                <li key={index}>{row.join(', ')}</li>
              ))}
            </ul>
          ) : (
            <p>No data available</p>
          )}
        </div>
      ))}
    </div>
  );
}