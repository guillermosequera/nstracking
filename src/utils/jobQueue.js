import { openDB } from 'idb';
import { addJob, addDispatchJob } from '@/utils/jobUtils';

class JobQueue {
  constructor() {
    this.processing = false;
    this.dbReady = false;
    this.initDB();
    this.eventListeners = new Map();
  }

  async initDB() {
    try {
      this.db = await openDB('jobsDB', 1, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('pendingJobs')) {
            db.createObjectStore('pendingJobs', { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains('failedJobs')) {
            db.createObjectStore('failedJobs', { keyPath: 'id' });
          }
        }
      });
      this.dbReady = true;
      console.log('IndexedDB inicializada correctamente');
    } catch (error) {
      console.error('Error inicializando IndexedDB:', error);
    }
  }

  async waitForDB() {
    if (!this.dbReady) {
      await new Promise(resolve => {
        const checkDB = () => {
          if (this.dbReady) {
            resolve();
          } else {
            setTimeout(checkDB, 100);
          }
        };
        checkDB();
      });
    }
  }

  // Método para obtener estado actual
  async getStatus() {
    try {
      await this.waitForDB();
      if (!this.db) return { pending: 0, failed: 0 };
      
      const pending = await this.db.count('pendingJobs');
      const failed = await this.db.count('failedJobs');
      return { pending, failed };
    } catch (error) {
      console.error('Error obteniendo estado:', error);
      return { pending: 0, failed: 0 };
    }
  }

  async add(jobData) {
    try {
      await this.waitForDB();
      const jobId = Date.now().toString();
      
      // Ya no sobrescribimos el status del trabajo
      const jobToStore = {
        id: jobId,
        ...jobData,
        timestamp: new Date().toISOString()
        // Eliminamos status: 'pending' para mantener el status original
      };

      await this.db.add('pendingJobs', jobToStore);
      this.emitEvent('jobAdded', { jobNumber: jobData.jobNumber });
      
      if (!this.processing) {
        this.processQueue();
      }

      return jobId;
    } catch (error) {
      console.error('Error añadiendo trabajo:', error);
      throw error;
    }
  }

  async processQueue() {
    if (this.processing) return;
    this.processing = true;

    try {
      while (true) {
        const pendingJobs = await this.db.getAll('pendingJobs');
        if (pendingJobs.length === 0) break;

        const job = pendingJobs[0];
        this.emitEvent('jobProcessing', { jobNumber: job.jobNumber });
        
        try {
          // Si es un trabajo de despacho, usar addDispatchJob
          if (job.role === 'workerDispatch') {
            await addDispatchJob(job, job.userEmail);
          } else {
            // Para otros tipos de trabajos, usar el addJob normal
            await addJob(
              job.jobNumber,
              job.userEmail,
              job.role,
              job.activePage,
              job.status
            );
          }
          
          await this.db.delete('pendingJobs', job.id);
          this.emitEvent('jobCompleted', { jobNumber: job.jobNumber });
        } catch (error) {
          console.error('Error procesando trabajo:', error);
          await this.db.delete('pendingJobs', job.id);
          await this.db.add('failedJobs', {
            ...job,
            error: error.message,
            failedAt: new Date().toISOString()
          });
          this.emitEvent('jobFailed', { 
            jobNumber: job.jobNumber, 
            error: error.message 
          });
        }

        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } finally {
      this.processing = false;
    }
  }

  // Método para reintentar trabajos fallidos
  async retryFailedJobs() {
    const failedJobs = await this.db.getAll('failedJobs');
    for (const job of failedJobs) {
      await this.db.delete('failedJobs', job.id);
      await this.add(job);
    }
  }

  // Agregar métodos para el sistema de eventos
  addEventListener(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event).add(callback);
  }

  removeEventListener(event, callback) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).delete(callback);
    }
  }

  emitEvent(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => callback(data));
    }
  }
}

export const jobQueue = typeof window !== 'undefined' ? new JobQueue() : null;

// Función auxiliar para obtener la cola de trabajos
export const getJobQueue = () => {
  if (typeof window === 'undefined') {
    console.warn('JobQueue no está disponible en el servidor');
    return null;
  }
  return jobQueue;
}; 