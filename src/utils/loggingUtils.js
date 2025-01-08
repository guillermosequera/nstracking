import { v4 as uuidv4 } from 'uuid';
import { sheetIds } from '@/config/roles';

// Enum para estados de transacción
export const TransactionStatus = {
  START: 'start',
  PROGRESS: 'progress',
  SUCCESS: 'success',
  ERROR: 'error'
};

// Función para generar ID de transacción
export const generateTransactionId = () => {
  const date = new Date().toISOString().split('T')[0];
  return `tx-${date}-${uuidv4().slice(0, 6)}`;
};

// Función principal para registrar logs
export const logTransaction = async ({
  transactionId,
  operation,
  status,
  jobNumber,
  details,
  user,
  sheetAffected
}) => {
  try {
    const timestamp = new Date().toISOString();
    
    const logEntry = {
      transactionId,
      timestamp,
      operation,
      status,
      jobNumber,
      details: JSON.stringify(details),
      user,
      sheetAffected
    };

    // Usar URL absoluta para llamadas del servidor
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const response = await fetch(`${apiUrl}/api/logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(logEntry)
    });

    if (!response.ok) {
      console.error('Error al registrar log:', await response.json());
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error en logTransaction:', error);
    return false;
  }
};

// Añadir esta función de prueba al final del archivo
export const testLogging = async () => {
  const transactionId = generateTransactionId();
  
  try {
    // Log de inicio
    await logTransaction({
      transactionId,
      operation: 'test_operation',
      status: TransactionStatus.START,
      jobNumber: 'TEST-001',
      details: { message: 'Iniciando prueba de logging' },
      user: 'test@italoptic.cl',
      sheetAffected: 'test_sheet'
    });

    // Log de éxito
    await logTransaction({
      transactionId,
      operation: 'test_operation',
      status: TransactionStatus.SUCCESS,
      jobNumber: 'TEST-001',
      details: { message: 'Prueba completada con éxito' },
      user: 'test@italoptic.cl',
      sheetAffected: 'test_sheet'
    });

    return true;
  } catch (error) {
    console.error('Error en prueba de logging:', error);
    return false;
  }
}; 