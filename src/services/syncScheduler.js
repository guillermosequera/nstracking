class SyncScheduler {
  constructor() {
    this.intervalId = null;
    this.isRunning = false;
  }

  shouldSync() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const hour = now.getHours();

    // Verificar si es día laboral (1-5 = Lunes-Viernes)
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      return false;
    }

    // Verificar si está dentro del horario laboral (8:00-18:00)
    if (hour < 8 || hour >= 18) {
      return false;
    }

    return true;
  }

  async executeSyncIfNeeded() {
    if (!this.shouldSync()) {
      console.log('Fuera de horario de sincronización');
      return;
    }

    try {
      console.log('Ejecutando sincronización programada...');
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        cache: 'no-store' // Asegura que no se use caché
      });

      if (!response.ok) {
        throw new Error('Error en la sincronización');
      }

      const result = await response.json();
      console.log('Resultado de sincronización:', result.message);
    } catch (error) {
      console.error('Error en sincronización programada:', error);
    }
  }

  start() {
    if (this.isRunning) {
      console.log('El programador ya está en ejecución');
      return;
    }

    console.log('Iniciando programador de sincronización');
    this.isRunning = true;

    // Ejecutar inmediatamente la primera vez si está en horario
    this.executeSyncIfNeeded();

    // Programar ejecuciones cada hora
    this.intervalId = setInterval(() => {
      this.executeSyncIfNeeded();
    }, 60 * 60 * 1000); // 1 hora en milisegundos
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
      console.log('Programador de sincronización detenido');
    }
  }
}

// Exportar una única instancia
export const syncScheduler = new SyncScheduler(); 