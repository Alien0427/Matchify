import { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function FeedbackModal({ open, onClose, onSubmit, user }) {
  const [jobRating, setJobRating] = useState(0);
  const [resumeRating, setResumeRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!jobRating || !resumeRating) {
      setError('Please rate both job matching and resume parsing.');
      return;
    }
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'feedback'), {
        jobRating,
        resumeRating,
        feedback,
        userId: user?.uid || null,
        userEmail: user?.email || null,
        createdAt: serverTimestamp(),
      });
      onSubmit({ jobRating, resumeRating, feedback });
    } catch (e) {
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/50 overflow-y-auto">
      <div className="fixed inset-0" onClick={onClose}></div>
      <div className="bg-[#18181b] rounded-2xl shadow-2xl p-8 border border-[#2a2a2e] max-w-md w-full flex flex-col items-center relative z-10 my-8">
        <h2 className="text-2xl font-bold mb-4 text-textPrimary">We value your feedback!</h2>
        <div className="mb-4 w-full">
          <label className="block text-textSecondary font-medium mb-2">How would you rate the job matching?</label>
          <StarRating value={jobRating} onChange={setJobRating} />
        </div>
        <div className="mb-4 w-full">
          <label className="block text-textSecondary font-medium mb-2">How would you rate the resume parsing?</label>
          <StarRating value={resumeRating} onChange={setResumeRating} />
        </div>
        <div className="mb-4 w-full">
          <label className="block text-textSecondary font-medium mb-2">Other feedback (optional)</label>
          <textarea
            className="w-full min-h-[80px] p-3 rounded-lg bg-surface/70 border border-accent/20 text-textPrimary placeholder-textSecondary/50 focus:border-accent focus:outline-none transition-colors duration-300"
            placeholder="Share your thoughts..."
            value={feedback}
            onChange={e => setFeedback(e.target.value)}
          />
        </div>
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <div className="flex gap-4 mt-2">
          <button
            className="bg-accent hover:bg-accentHover text-white font-semibold px-6 py-2 rounded-full shadow-neon transition-all duration-300"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </button>
          <button
            className="bg-gray-700 hover:bg-gray-800 text-white font-semibold px-6 py-2 rounded-full transition-all duration-300"
            onClick={onClose}
            disabled={submitting}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={
            star <= value
              ? 'text-yellow-400 text-2xl'
              : 'text-gray-400 text-2xl hover:text-yellow-300'
          }
          aria-label={`Rate ${star}`}
        >
          ★
        </button>
      ))}
    </div>
  );
} 