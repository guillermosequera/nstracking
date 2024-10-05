// src/utils/jobUtils.js
import { sheetIds } from '@/config/roles';

export const fetchJobs = async (timeFrame, role) => {
  console.log(`Fetching jobs for timeFrame: ${timeFrame} and role: ${role}`);
  if (!role) {
    throw new Error('User role is not defined');
  }
  try {
    const url = `/api/sheets?role=${role}&timeFrame=${timeFrame}`;
    console.log(`Sending request to: ${url}`);
    const response = await fetch(url);
    console.log(`Received response with status: ${response.status}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to fetch jobs for ${timeFrame}`);
    }
    const data = await response.json();
    console.log(`Fetched jobs for ${timeFrame}:`, data);
    if (!Array.isArray(data)) {
      throw new Error(`Invalid data format received for ${timeFrame}`);
    }
    return data;
  } catch (error) {
    console.error(`Error fetching jobs for ${timeFrame}:`, error);
    throw error;
  }
};

export const addJob = async (jobNumber, userEmail, userRole, activePage) => {
  console.log(`Adding job for user: ${userEmail} on page: ${activePage}, role: ${userRole}`);
  const timestamp = new Date().toISOString();
  try {
    const status = getStatusFromPage(activePage);
    const body = {
      role: userRole,
      activePage,
      jobNumber: jobNumber.trim(),
      timestamp,
      userEmail,
      status
    };

    const response = await fetch('/api/sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    console.log(`Received response with status: ${response.status}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add job');
    }
    const data = await response.json();
    console.log('Added new job:', data.newJob);

    return data.newJob;
  } catch (error) {
    console.error('Error adding job:', error);
    throw error;
  }
};


export const addDispatchJob = async (jobData, userEmail) => {
  console.log(`Adding dispatch job for user: ${userEmail}`);
  const timestamp = new Date().toISOString();
  try {
    const status = getStatusFromPage('dispatch');
    const body = {
      activePage: 'dispatch',
      jobNumber: jobData.jobNumber,
      timestamp: timestamp,
      userEmail: userEmail,
      status: status,
      company: jobData.company,
      ...(jobData.company === 'trento' 
        ? { agreement: jobData.agreement }
        : { 
            client: jobData.client,
            invoiceNumber: jobData.invoiceNumber,
            shippingCompany: jobData.shippingCompany,
            shippingOrder: jobData.shippingOrder
          })
    };

    const response = await fetch('/api/sheets/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add dispatch job');
    }
    const data = await response.json();
    console.log('Added new dispatch job:', data.newJob);
    return data.newJob;
  } catch (error) {
    console.error('Error adding dispatch job:', error);
    throw error;
  }
};



export const fetchJobStatus = async (jobNumber) => {
  console.log(`Fetching status for job: ${jobNumber}`);
  try {
    const url = `/api/sheets?role=status&jobNumber=${jobNumber}`;
    console.log(`Sending request to: ${url}`);
    const response = await fetch(url);
    console.log(`Received response with status: ${response.status}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to fetch status for job ${jobNumber}`);
    }
    const data = await response.json();
    console.log(`Fetched status for job ${jobNumber}:`, data);
    if (!Array.isArray(data)) {
      throw new Error(`Invalid data format received for job ${jobNumber}`);
    }
    return data;
  } catch (error) {
    console.error(`Error fetching status for job ${jobNumber}:`, error);
    throw error;
  }
};

export const addJobAR = async (jobData, userEmail, userRole, activePage) => {
  console.log(`Adding AR job for user: ${userEmail} on page: ${activePage}`);
  const timestamp = new Date().toISOString();
  try {
    const status = getStatusFromPage(activePage);
    const body = {
      role: userRole,
      activePage,
      jobNumber: jobData.jobNumber.trim(),
      crystalType: jobData.crystalType,
      timestamp,
      userEmail,
      status
    };

    const response = await fetch('/api/sheets/ar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    console.log(`Received response with status: ${response.status}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to add AR job');
    }
    const data = await response.json();
    console.log('Added new AR job:', data.newJob);

    return data.newJob;
  } catch (error) {
    console.error('Error adding AR job:', error);
    throw error;
  }
};

export const getStatusFromPage = (activePage) => {
  const statusMap = {
    warehouse: 'Fuera de Bodega',
    commerce: 'Fuera de Comercial',
    quality: 'Fuera de Control de Calidad',
    labs: 'Fuera de Laboratorio',
    labsMineral: 'Fuera de Laboratorio Mineral',
    montage: 'Fuera de Montaje',
    dispatch: 'Despachado'
  };
  return statusMap[activePage] || 'Estado Desconocido';
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


export const fetchQualityJobs = async (timeFrame, sheet) => {
  console.log(`Fetching quality jobs for timeFrame: ${timeFrame} and sheet: ${sheet}`);
  try {
    const url = `/api/quality?sheet=${sheet}&timeFrame=${timeFrame}`;
    console.log(`Sending request to: ${url}`);
    const response = await fetch(url);
    console.log(`Received response with status: ${response.status}`);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Failed to fetch quality jobs for ${timeFrame}`);
    }
    const data = await response.json();
    console.log(`Fetched quality jobs for ${timeFrame}:`, data);
    if (!Array.isArray(data)) {
      throw new Error(`Invalid data format received for ${timeFrame}`);
    }
    return data;
  } catch (error) {
    console.error(`Error fetching quality jobs for ${timeFrame}:`, error);
    throw error;
  }
};