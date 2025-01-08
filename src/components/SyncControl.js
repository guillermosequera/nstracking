'use client';

import { useState, useEffect } from 'react';
import { syncScheduler } from '@/services/syncScheduler';
import { Button } from '@/components/ui/Button';
import { Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';

export default function SyncControl({ variant = 'full' }) {
  const [isRunning, setIsRunning] = useState(false);
  const [lastSync, setLastSync] = useState(null);
  const [message, setMessage] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    setIsRunning(syncScheduler.isRunning);
  }, []);

  const handleStartSync = () => {
    syncScheduler.start();
    setIsRunning(true);
    setMessage('Sincronización programada iniciada');
  };

  const handleStopSync = () => {
    syncScheduler.stop();
    setIsRunning(false);
    setMessage('Sincronización programada detenida');
  };

  const handleManualSync = async () => {
    try {
      setIsSyncing(true);
      setMessage('Ejecutando sincronización manual...');
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userEmail: session?.user?.email
        })
      });

      const data = await response.json();
      setMessage(data.message);
      setLastSync(new Date().toLocaleString());
    } catch (error) {
      setMessage('Error en la sincronización: ' + error.message);
    } finally {
      setIsSyncing(false);
    }
  };

  if (variant === 'minimal') {
    return (
      <div className="flex items-center gap-2">
        <Button
          onClick={handleManualSync}
          variant="outline"
          size="sm"
          disabled={isSyncing}
          className="flex items-center gap-2 bg-slate-300 hover:bg-slate-700 text-blue-600 border-slate-600"
        >
          {isSyncing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <span>Sincronizar Estados</span>
          )}
        </Button>
        {isRunning && (
          <Button
            onClick={handleStopSync}
            variant="outline"
            size="sm"
            className="bg-red-200 hover:bg-red-300 text-red-600 border-red-600"
          >
            Detener Auto
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Control de Sincronización</h2>
      
      <div className="space-y-4">
        <div className="flex items-center space-x-4">
          <Button
            onClick={handleManualSync}
            disabled={isSyncing}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            {isSyncing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Sincronizando...
              </>
            ) : (
              'Sincronizar Ahora'
            )}
          </Button>

          {isRunning ? (
            <Button
              onClick={handleStopSync}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Detener Programación
            </Button>
          ) : (
            <Button
              onClick={handleStartSync}
              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Iniciar Programación
            </Button>
          )}
        </div>

        <div className="text-sm">
          <p className="text-gray-600">
            Estado: <span className="font-medium">{isRunning ? 'Activo' : 'Inactivo'}</span>
          </p>
          {lastSync && (
            <p className="text-gray-600">
              Última sincronización: <span className="font-medium">{lastSync}</span>
            </p>
          )}
          {message && (
            <p className="mt-2 text-gray-700">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
} 