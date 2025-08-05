export const metadata = {
  title: 'Job Details | Resume2Job',
  description: 'Detailed job information, score breakdown, and skill match analysis.',
};

import JobDetail from '../../../components/JobDetail';

export default async function JobDetailPage({ params }) {
  const { jobId } = await params;
  
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <JobDetail jobId={jobId} />
    </main>
  );
} 