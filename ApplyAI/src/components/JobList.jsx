"use client";
import JobCard from './JobCard';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
// import ProModal from './ProModal';
import { useAuth } from '../context/AuthContext';
import FeedbackModal from './FeedbackModal';

export default function JobList({ jobs }) {
  const router = useRouter();
  const { user } = useAuth();
  const [showProModal, setShowProModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

useEffect(() => {
    console.log('Jobs received:', jobs);
  }, [jobs]);
  
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setFeedbackGiven(!!localStorage.getItem('feedbackGiven'));
    }
  }, []);

  useEffect(() => {
    if (showProModal) {
      document.body.classList.add('modal-blur');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('modal-blur');
      document.body.style.overflow = '';
    }
    return () => {
      document.body.classList.remove('modal-blur');
      document.body.style.overflow = '';
    };
  }, [showProModal]);
  
  if (!jobs || jobs.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No jobs to display.</p>
      </div>
    );
  }
  
  function getViewedJobsKey(user) {
    return user ? `viewedJobs_${user.uid}` : 'viewedJobs';
  }
  function hasQuota(user) {
    if (typeof window === 'undefined') return true;
    if (!user) return true; // Always allow if not signed in (sign-in modal will handle it)
    const viewed = JSON.parse(localStorage.getItem(getViewedJobsKey(user)) || '[]');
    return viewed.length < 2;
  }
  
  const handleJobClick = (job) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    let viewed = [];
    if (typeof window !== 'undefined') {
      viewed = JSON.parse(localStorage.getItem(getViewedJobsKey(user)) || '[]');
      const jobId = String(job.job_id || job.id);
      if (!viewed.includes(jobId)) {
        viewed.push(jobId);
        localStorage.setItem(getViewedJobsKey(user), JSON.stringify(viewed));
      }
      // Commented out quota logic
      // if (viewed.length > 2) {
      //   if (!localStorage.getItem('feedbackGiven')) {
      //     setShowFeedback(true);
      //   } else {
      //     setShowProModal(true);
      //   }
      //   return; // Block navigation
      // }
    }
    // Commented out quota logic
    // if (hasQuota(user)) {
      router.push(`/jobs/${job.job_id || job.id || job.id}`);
    // } else {
    //   if (!localStorage.getItem('feedbackGiven')) {
    //     setShowFeedback(true);
    //   } else {
    //     setShowProModal(true);
    //   }
    // }
  };
  
  const handleKeyDown = (e, job) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleJobClick(job);
    }
  };
  
  const handleFeedbackSubmit = (data) => {
    localStorage.setItem('feedbackGiven', 'true');
    setFeedbackGiven(true);
    setShowFeedback(false);
    // setShowProModal(true); // Commented out as per edit hint
    // Optionally send 'data' to backend here
  };
  
  return (
    <>
      <FeedbackModal
        open={showFeedback && !feedbackGiven}
        onClose={() => {
          setShowFeedback(false);
          // setShowProModal(true); // Commented out as per edit hint
        }}
        onSubmit={handleFeedbackSubmit}
        user={user}
      />
      {/* <ProModal open={showProModal} onClose={() => setShowProModal(false)} /> */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-white rounded-lg p-8 max-w-sm w-full text-center">
            <h2 className="text-2xl font-bold mb-4 text-gray-900">Sign In Required</h2>
            <p className="mb-6 text-gray-700">Please sign in to view job details.</p>
            <button
              className="bg-purple-600 text-white px-6 py-2 rounded font-semibold hover:bg-purple-700 transition mb-2 w-full"
              onClick={() => { window.location.href = '/'; }}
            >
              Sign in with Google
            </button>
            <button
              className="mt-2 text-gray-500 underline w-full"
              onClick={() => setShowAuthModal(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      <ul className="space-y-4">
        {jobs.map((job, idx) => (
          <li key={job.job_id || idx}>
            <div
              tabIndex={0}
              role="button"
              aria-label={`View details for ${job.title} at ${job.company}`}
              onClick={() => handleJobClick(job)}
              onKeyDown={e => handleKeyDown(e, job)}
              className="cursor-pointer focus:outline-none"
            >
              <JobCard job={job} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
} 