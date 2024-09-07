'use client'

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getUserRole, sheetIds } from '@/config/roles';
import Link from 'next/link';
import LogoutButton from './LogoutButton';

export default function WorkerPageBase({ title, role }) {
  const { data: session, status } = useSession();
  const [sheetData, setSheetData] = useState([]);
  const [newEntry, setNewEntry] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (session) {
      fetchSheetData();
    }
  }, [session]);

  async function fetchSheetData() {
    try {
      const response = await fetch(`/api/sheets?role=${role}`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setSheetData(data);
      setError('');
    } catch (error) {
      console.error('Error fetching sheet data:', error);
      setError('Error fetching sheet data. Check console for details.');
    }
  }

  async function handleAppendEntry() {
    if (newEntry) {
      try {
        const response = await fetch('/api/sheets', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role, values: [new Date().toISOString(), newEntry] }),
        });
        if (!response.ok) throw new Error('Failed to append');
        setNewEntry('');
        fetchSheetData();
        setError('');
      } catch (error) {
        console.error('Error appending to sheet:', error);
        setError('Error appending to sheet. Check console for details.');
      }
    }
  }

  if (status === 'loading') return <p>Loading...</p>;
  if (!session) return <p>Access Denied</p>;

  const userRole = getUserRole(session.user.email);

  return (
    <div>
      <h1>{title}</h1>
      <p>Signed in as {session.user.email}</p>
      <p>Role: {userRole || 'No role assigned'}</p>
      <Link href="/status">Go to Status Page</Link>
      <LogoutButton />

      {error && <p style={{color: 'red'}}>{error}</p>}

      <h2>Sheet Data</h2>
      {sheetData.length > 0 ? (
        <ul>
          {sheetData.map((row, index) => (
            <li key={index}>{row.join(', ')}</li>
          ))}
        </ul>
      ) : (
        <p>No data available</p>
      )}

      <h2>Add New Entry</h2>
      <input
        type="text"
        value={newEntry}
        onChange={(e) => setNewEntry(e.target.value)}
        placeholder="Enter new data"
      />
      <button onClick={handleAppendEntry}>Add to Sheet</button>
    </div>
  );
}