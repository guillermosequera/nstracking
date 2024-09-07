// src/app/developer/stats/page.js
'use client'

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getUserRole } from '@/config/roles';

export default function DeveloperStatsPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (session) {
      fetchStats();
    }
  }, [session]);

  async function fetchStats() {
    try {
      const response = await fetch('/api/developer/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      const data = await response.json();
      setStats(data);
      setError('');
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Error fetching stats. Check console for details.');
    }
  }

  if (status === 'loading') return <p>Loading...</p>;
  if (!session) return <p>Access Denied</p>;

  const userRole = getUserRole(session.user.email);
  if (userRole !== 'adminAdmin') return <p>Access Denied. Only super admins can view this page.</p>;

  return (
    <div>
      <h1>Developer Statistics</h1>
      <p>Signed in as {session.user.email}</p>

      {error && <p style={{color: 'red'}}>{error}</p>}

      {stats ? (
        <div>
          <h2>Application Statistics</h2>
          <ul>
            <li>Daily API Requests: {stats.dailyApiRequests}</li>
            <li>Active Users: {stats.activeUsers}</li>
            <li>Total Usage Hours: {stats.totalUsageHours}</li>
            <li>Production Improvement: {stats.productionImprovement}%</li>
            <li>Production Detail Level: {stats.productionDetailLevel}</li>
          </ul>
        </div>
      ) : (
        <p>Loading stats...</p>
      )}
    </div>
  );
}