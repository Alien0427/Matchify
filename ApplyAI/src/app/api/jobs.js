import { getJobData } from '../../lib/job-data';

export default async function handler(req, res) {
  try {
    const jobs = await getJobData();
    res.status(200).json(jobs);
  } catch (error) {
    console.error('Error fetching job data:', error);
    res.status(500).json({ error: 'Failed to fetch job data' });
  }
}