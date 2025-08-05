"use client";
import { useContext, useState } from 'react';
import { JobResultsContext } from '../context/JobResultsContext';
import ScoreBreakdown from './ScoreBreakdown';
import SkillMatchList from './SkillMatchList';
import { Button } from './ui/Button';
import { useAuth } from '../context/AuthContext';
import JobApplicationForm from './JobApplicationForm';

export default function JobDetail({ jobId }) {
  const { jobResults } = useContext(JobResultsContext);
  const { user } = useAuth ? useAuth() : {};
  const [showApplicationForm, setShowApplicationForm] = useState(false);
  
  if (!jobResults || !jobResults.matches) return <div>No job data found.</div>;
  // Find job by jobId (fallback to index if job_id is missing)
  const job = jobResults.matches.find(j => String(j.job_id) === String(jobId)) || jobResults.matches[jobId] || null;
  if (!job) return <div>Job not found.</div>;

  // LLM explanation/reason (if available)
  const llmReason = job.llm_reason || job.reason || '';
  
  // Debug logs - remove in production
  console.log('JobDetail - Job object:', JSON.stringify(job, null, 2));
  console.log('JobDetail - Job ID:', job.id || job.job_id);
  console.log('JobDetail - Recruiter ID:', job.recruiterId || job.recruiter_id);
  
  // Get recruiter ID, handling both property names
  const recruiterId = job.recruiterId || job.recruiter_id;
  const resolvedJobId = job.id || job.job_id;
  
  console.log('JobDetail - Using recruiterId:', recruiterId);
  console.log('JobDetail - Using jobId:', resolvedJobId);

  const handleApplyClick = () => {
    if (!user) {
      alert('Please sign in to apply for this position.');
      return;
    }
    console.log('Apply clicked - jobId:', resolvedJobId, 'recruiterId:', recruiterId);
    setShowApplicationForm(true);
  };

  const handleApplicationClose = () => {
    setShowApplicationForm(false);
  };

  return (
    <div className="rounded-2xl p-10 bg-gradient-to-br from-white/5 via-purple-900/10 to-black/30 border border-purple-900/20 shadow-2xl hover:shadow-[0_8px_48px_0_rgba(168,85,247,0.25)] transition-all duration-300 backdrop-blur-md max-w-2xl mx-auto mt-8 group">
      <h2 className="text-3xl font-extrabold text-white mb-2 drop-shadow-sm group-hover:text-purple-300 transition-colors duration-200">{job.title}</h2>
      <div className="text-purple-300 text-lg font-medium mb-4">{job.company}</div>
      <div className="text-gray-200 mb-6 leading-relaxed">{job.description}</div>
      <ScoreBreakdown job={job} />
      <SkillMatchList job={job} />
      <div className="mt-6 bg-black/40 p-4 rounded-lg border border-purple-900/30">
        <strong className="text-purple-400">AI Explanation:</strong>
        <div className="mt-2 whitespace-pre-line text-gray-200">
          {llmReason.trim() ? llmReason : (
            <span className="text-red-400 font-medium">
              No explanation available from the AI. Please try re-uploading your resume or contact support.
            </span>
          )}
        </div>
      </div>
      
      {/* Application section */}
      <div className="mt-8">
        {recruiterId ? (
          <>
            <Button
              className="text-lg font-bold py-3 px-8 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 shadow-lg hover:from-purple-600 hover:to-fuchsia-600 transition drop-shadow-[0_0_16px_rgba(168,85,247,0.5)]"
              onClick={handleApplyClick}
              size="lg"
            >
              Apply Now
            </Button>
            {showApplicationForm && (
              <JobApplicationForm
                jobId={resolvedJobId}
                recruiterId={recruiterId}
                onClose={handleApplicationClose}
              />
            )}
          </>
        ) : job.link ? (
          <a
            href={job.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <Button
              className="text-lg font-bold py-3 px-8 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 shadow-lg hover:from-purple-600 hover:to-fuchsia-600 transition drop-shadow-[0_0_16px_rgba(168,85,247,0.5)]"
              size="lg"
            >
              Apply on Company Site
            </Button>
          </a>
        ) : (
          <span className="text-red-400 font-medium">No application method available</span>
        )}
      </div>
    </div>
  );
}