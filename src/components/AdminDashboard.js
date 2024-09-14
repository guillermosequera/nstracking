'use client'

import Link from 'next/link';

export default function AdminDashboard({ session, sheetData, loading, error, onRefresh }) {
  const totalEntries = sheetData && typeof sheetData === 'object'
    ? Object.values(sheetData).reduce((sum, data) => sum + (Array.isArray(data) ? data.length : 0), 0)
    : 0;

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>
      {session && session.user && (
        <p>Signed in as {session.user.email}</p>
      )}
      <Link href="/status" className="text-blue-500 hover:underline">Go to Status Page</Link>

      <div className="mt-4">
        <button 
          onClick={onRefresh}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Entries" value={totalEntries} />
        {sheetData && typeof sheetData === 'object' && Object.entries(sheetData).map(([role, data]) => (
          <StatCard key={role} title={`${role} Entries`} value={Array.isArray(data) ? data.length : 0} />
        ))}
      </div>

      <h2 className="text-xl font-semibold mt-8 mb-4">All Sheet Data</h2>
      {sheetData && typeof sheetData === 'object' && Object.entries(sheetData).map(([role, data]) => (
        <div key={role} className="mb-6">
          <h3 className="text-lg font-semibold">{role}</h3>
          {Array.isArray(data) && data.length > 0 ? (
            <ul className="list-disc pl-5">
              {data.map((row, index) => (
                <li key={index}>{Array.isArray(row) ? row.join(', ') : String(row)}</li>
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

function StatCard({ title, value }) {
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}