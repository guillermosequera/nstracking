'use client'

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getUserRole, workerRoles } from '@/config/roles';
import Link from 'next/link';
import AdminDashboard from '@/components/AdminDashboard';

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [sheetData, setSheetData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (session) {
      fetchAllSheetData();
    }
  }, [session]);

  async function fetchAllSheetData() {
    setLoading(true);
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
      setError('Error fetching sheet data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }

  if (status === 'loading') return <p>Loading...</p>;
  if (!session) return <p>Access Denied</p>;

  const userRole = getUserRole(session.user.email);
  if (userRole !== 'admin') return <p>Access Denied. Admin only.</p>;

  return (
    <AdminDashboard
      session={session}
      sheetData={sheetData}
      loading={loading}
      error={error}
      onRefresh={fetchAllSheetData}
    />
  );
}