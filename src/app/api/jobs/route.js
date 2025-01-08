import { updateJobAreaAndStatus } from '@/utils/jobUtils';

// En tu manejador POST/PUT
try {
  const result = await updateJobAreaAndStatus(
    jobId,
    newArea,
    newStatus,
    userId
  );
  return NextResponse.json(result);
} catch (error) {
  return NextResponse.json(
    { error: error.message },
    { status: 500 }
  );
} 