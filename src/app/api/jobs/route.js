import { NextResponse } from 'next/server';
import { updateJobAreaAndStatus } from '@/utils/jobUtils';

export async function PUT(request) {
  try {
    const { jobId, newArea, newStatus, userId } = await request.json();
    
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
} 