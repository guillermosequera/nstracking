export const fetchJobs = async (timeFrame) => {
  console.log(`Fetching jobs for timeFrame: ${timeFrame}`);
  try {
    const url = `/api/sheets?role=workerMontage&timeFrame=${timeFrame}`;
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

export const addJob = async (jobNumber, userEmail) => {
  console.log(`Adding job: ${jobNumber} for user: ${userEmail}`);
  try {
    const response = await fetch('/api/sheets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        role: 'workerMontage', 
        values: [jobNumber.trim(), new Date().toISOString(), userEmail] 
      }),
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