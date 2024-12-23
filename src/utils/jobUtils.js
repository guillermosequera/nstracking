// src/utils/jobUtils.js
import { sheetIds } from '@/config/roles';

export const fetchJobs = async (timeFrame, type, companyFilter = null) => {
  console.log('Fetching jobs:', { timeFrame, type, companyFilter });
  
  try {
    const params = new URLSearchParams();
    
    if (timeFrame === 'unassigned') {
      params.append('type', 'unassigned');
    }
    
    if (companyFilter && companyFilter !== 'todos') {
      params.append('companyFilter', companyFilter);
    }
    
    let endpoint;
    if (type === 'workerDispatch') {
      endpoint = `/api/sheets/dispatch?${params.toString()}`;
    } else if (type === 'workerQuality') {
      endpoint = `/api/quality?${params.toString()}`;
    } else {
      params.append('role', type);
      endpoint = `/api/sheets?${params.toString()}`;
    }
    
    console.log('Requesting from endpoint:', endpoint);
    
    const response = await fetch(endpoint);
    if (!response.ok) {
      console.error('Error response:', response.status, response.statusText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Data received:', {
      endpoint,
      rowCount: data?.length,
      sampleRow: data?.[1] // Primera fila después del encabezado
    });
    
    return data;
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return [];
  }
};

export const logChange = async (jobNumber, action, timestamp, userRole) => {
  console.log('Iniciando logChange:', { jobNumber, action, timestamp, userRole });
  
  try {
    const response = await fetch('/api/sheets', {  // Cambiar a la ruta correcta
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobNumber,
        action,
        timestamp: timestamp || new Date().toISOString(),
        userRole,
        type: 'log'  // Agregar tipo para diferenciar la acción
      })
    });

    if (!response.ok) {
      console.error('Error en logChange:', response.status, response.statusText);
      throw new Error('Failed to log change');
    }
    
    const data = await response.json();
    console.log('Cambio registrado:', data);
    return data;
  } catch (error) {
    console.error('Error logging change:', error);
    throw error;
  }
};


export async function onDelete(jobNumber, timestamp, role, userEmail) {
  try {
    // Ruta especial para Commerce
    if (role === 'workerCommerce') {
      const response = await fetch('/api/jobs/commerce/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobNumber,
          timestamp,
          userEmail
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(`Error al eliminar: ${data.error || 'Error desconocido'}`);
      }

      return await response.json();
    }

    // Ruta especial para Dispatch
    if (role === 'workerDispatch') {
      const response = await fetch('/api/sheets/dispatch/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobNumber,
          timestamp,
          userEmail
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(`Error al eliminar: ${data.error || 'Error desconocido'}`);
      }

      return await response.json();
    }

    // Mantener la lógica existente para los demás roles
    const response = await fetch('/api/jobs/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobNumber,
        timestamp,
        role,
        userEmail
      }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(`Error al eliminar: ${data.error || 'Error desconocido'}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error en onDelete:', error);
    throw error;
  }
}


export const onEdit = async (jobNumber, updatedData) => {
  if (!jobNumber) {
    throw new Error('Invalid job number');
  }
  console.log(`Editing job: ${jobNumber}`);
  try {
    const response = await fetch(`/api/jobs/${jobNumber}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to edit job');
    }

    const data = await response.json();
    console.log('Job edited successfully:', data);
    return data;
  } catch (error) {
    console.error('Error editing job:', error);
    throw error;
  }
};

export const addJob = async (jobNumber, userEmail, role, activePage, status, maxRetries = 3) => {
  let attempt = 0;
  
  while (attempt < maxRetries) {
    try {
      const response = await fetch('/api/sheets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobNumber: jobNumber.trim(),
          timestamp: new Date().toISOString(),
          userEmail,
          role,
          activePage,
          status,
          attempt: attempt + 1
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add job');
      }

      return await response.json();
    } catch (error) {
      console.error(`Error en intento ${attempt + 1}:`, error);
      attempt++;
      
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Esperar antes de reintentar
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
};

export const addDispatchJob = async (jobData, userEmail) => {
  if (!sheetIds.workerDispatch) {
    throw new Error('Missing dispatch spreadsheet configuration');
  }

  try {
    // Estructuramos los datos en el orden correcto para las columnas
    const dataToSend = {
      jobNumber: jobData.jobNumber,
      timestamp: new Date().toISOString(),
      company: jobData.company || 'Sin Asignar', // Columna C: Empresa
      client: jobData.client || '',
      invoice: jobData.invoiceNumber || '',
      shippingCompany: jobData.shippingCompany || '',
      shippingOrder: jobData.shippingOrder || '',
      userEmail: userEmail,
      status: jobData.status || 'En despacho',
      spreadsheetId: sheetIds.workerDispatch
    };

    console.log('Enviando datos a dispatch:', dataToSend);

    const response = await fetch('/api/sheets/dispatch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSend),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al agregar el trabajo');
    }

    return await response.json();
  } catch (error) {
    console.error('Error en addDispatchJob:', error);
    throw error;
  }
};

export const fetchJobStatus = async (jobNumber) => {
  console.log(`Fetching status for job: ${jobNumber}`);
  
  try {
    const response = await fetch(`/api/status?jobNumber=${jobNumber}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response:', errorData);
      throw new Error(errorData.error || 'Error al obtener el estado del trabajo');
    }

    const data = await response.json();
    console.log(`Processed ${data.length} records for job ${jobNumber}`);
    
    return data;
  } catch (error) {
    console.error('Error fetching job status:', error);
    throw error;
  }
};

export const getStatusFromPage = (activePage, selectedStatus = null) => {
  // Si hay un estado seleccionado por el usuario, lo usamos
  if (selectedStatus && selectedStatus.area && selectedStatus.option) {
    return `${selectedStatus.area} - ${selectedStatus.option}`;
  }

  // Si no hay estado seleccionado, usamos el mapeo anterior como fallback
  const statusMap = {
    warehouse: 'Fuera de Bodega',
    commerce: 'Digitacion',
    quality: 'Fuera de Control de Calidad',
    labs: 'Fuera de Laboratorio',
    labsMineral: 'Fuera de Laboratorio Mineral',
    montage: 'Fuera de Montaje',
    dispatch: 'Despachado'
  };
  
  return statusMap[activePage] || 'Estado Desconocido';
};

export const addJobAR = async (jobData, userEmail, userRole, activePage) => {
  try {
    if (typeof jobData.status !== 'string') {
      throw new Error('El estado debe ser un string');
    }

    const response = await fetch('/api/sheets/ar', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jobNumber: jobData.jobNumber,
        status: jobData.status,
        userEmail,
        role: userRole,
        activePage,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al agregar el trabajo');
    }

    return await response.json();
  } catch (error) {
    console.error('Error en addJobAR:', error);
    throw error;
  }
};

export const addQualityJob = async (jobData, userEmail) => {
  console.log(`Adding quality job for user: ${userEmail}`);
  const timestamp = new Date().toISOString();
  try {
    const body = {
      ...jobData,
      timestamp,
      userEmail,
    };

    console.log('Sending quality job data:', body);

    const response = await fetch('/api/quality', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Server error response:', errorData);
      throw new Error(errorData.error || `Failed to add quality job. Status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Added new quality job:', data.newJob);
    return data.newJob;
  } catch (error) {
    console.error('Error adding quality job:', error);
    throw error;
  }
};

export const fetchQualityJobs = async (sheet) => {
  if (!sheet) {
    throw new Error('Sheet parameter is required');
  }

  try {
    const response = await fetch(`/api/quality?sheet=${sheet}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Server response error:', errorData);
      throw new Error(errorData.error || 'Error al cargar trabajos');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching quality jobs:', error);
    throw error;
  }
}

export const fetchDelayedJobs = async () => {
  try {
    const timestamp = new Date().getTime();
    const response = await fetch(`/api/delayed-jobs?t=${timestamp}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al obtener los trabajos atrasados');
    }

    const data = await response.json();
    console.log(`Recibidos ${data.length} trabajos atrasados`);
    return data;

  } catch (error) {
    console.error('Error en fetchDelayedJobs:', error);
    throw new Error(`No se pudieron cargar los trabajos atrasados: ${error.message}`);
  }
};

export async function updateJobAreaAndStatus(jobId, areaChange, statusChange, userId) {
  const transactionResult = await TransactionManager.executeTransaction({
    jobId,
    areaChange,
    statusChange,
    userId
  });

  if (!transactionResult.success) {
    throw new Error(`Failed to update job: ${transactionResult.error}`);
  }

  return transactionResult.data;
}