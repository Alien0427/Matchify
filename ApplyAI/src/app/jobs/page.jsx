"use client";
import { useState, useEffect, useCallback } from 'react';
import FeedbackModal from '../../components/FeedbackModal';
import { useAuth } from '../../context/AuthContext';

import JobTabs from '../../components/JobTabs';

export default function JobsPage() {
  const { user } = useAuth();
  const [showFeedback, setShowFeedback] = useState(false);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setFeedbackGiven(!!localStorage.getItem('feedbackGiven'));
    }
  }, []);

  const handlePageClick = useCallback(() => {
    if (!feedbackGiven) setShowFeedback(true);
  }, [feedbackGiven]);

  const handleFeedbackSubmit = useCallback((data) => {
    localStorage.setItem('feedbackGiven', 'true');
    setFeedbackGiven(true);
    setShowFeedback(false);
    // Optionally, you could send 'data' to a backend here
  }, []);

  return (
    <main
      className="min-h-screen bg-black bg-gradient-to-br from-black via-purple-950/40 to-black flex flex-col items-center justify-start py-16 px-4"
      onClick={handlePageClick}
      style={{ cursor: !feedbackGiven ? 'pointer' : 'auto' }}
    >
      <FeedbackModal
        open={showFeedback && !feedbackGiven}
        onClose={() => setShowFeedback(false)}
        onSubmit={handleFeedbackSubmit}
        user={user}
      />
      <div className="w-full max-w-4xl mb-12">
        <div className="rounded-2xl bg-gradient-to-br from-white/5 via-purple-900/10 to-black/30 shadow-xl p-10 border border-purple-900/20 backdrop-blur-md">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 text-white">
            Job <span className="text-transparent bg-gradient-to-r from-purple-400 via-purple-500 to-fuchsia-500 bg-clip-text drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]">Matches</span>
          </h1>
          <p className="text-lg text-gray-300 max-w-2xl">
            Find your perfect job match based on your resume and skills. Explore top opportunities tailored for you by AI.
          </p>
        </div>
      </div>
      <div className="w-full max-w-3xl">
        <JobTabs />
      </div>
    </main>
  );
} 