import { NextResponse } from 'next/server';
import SheetsController from '@/controllers/SheetsController';
import GoogleSheetsService from '@/services/googleSheetsService';

const sheetsController = new SheetsController(GoogleSheetsService);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const timeFrame = searchParams.get('timeFrame');
  const jobNumber = searchParams.get('jobNumber');

  if (!role) {
    return NextResponse.json({ error: 'Role is required' }, { status: 400 });
  }

  if (role === 'status' && !jobNumber) {
    return NextResponse.json({ error: 'Job number is required for status check' }, { status: 400 });
  }

  if (role !== 'status' && !timeFrame) {
    return NextResponse.json({ error: 'Time frame is required' }, { status: 400 });
  }

  try {
    if (role === 'status' && jobNumber) {
      const jobStatus = await sheetsController.getJobStatus(jobNumber);
      return NextResponse.json(jobStatus);
    }

    const data = await sheetsController.getSheetData(role, timeFrame);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/sheets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body.jobNumber || !body.timestamp || !body.userEmail || !body.role || !body.activePage) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newJob = await sheetsController.addJob(body);
    return NextResponse.json({ newJob, message: 'Job added successfully to both sheets' });
  } catch (error) {
    console.error('Error in POST /api/sheets:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}