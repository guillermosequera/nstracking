import { testLogging } from '@/utils/loggingUtils';

export async function GET() {
  try {
    const result = await testLogging();
    return Response.json({ success: result });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
} 