import { NextResponse } from 'next/server';
import { syncWorkerStatuses } from './syncService';

export async function POST(request) {
  try {
    const { userEmail } = await request.json();
    const result = await syncWorkerStatuses(userEmail);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error en la sincronización:', error);
    return NextResponse.json({
      success: false,
      message: `Error en la sincronización: ${error.message}`
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: 'Sync endpoint ready' });
} 