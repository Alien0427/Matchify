import { getJobData } from '../../../lib/job-data';

export async function GET(request) {
  try {
    const jobs = await getJobData();
    return Response.json({ success: true, data: jobs });
  } catch (error) {
    console.error('Job fetch error:', error);
    return Response.json({ 
      success: false, 
      error: error.message || 'Failed to fetch jobs' 
    }, { status: 500 });
  }
}