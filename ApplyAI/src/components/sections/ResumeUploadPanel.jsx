"use client";
import { Tabs, Tab } from "@/components/ui/tabs";
import ResumeUpload from "@/components/ResumeUpload";
import { Progress } from "@/components/ui/Progress";
import { useEffect, useState, useContext } from "react";
import { motion } from "framer-motion";
import { useRouter } from 'next/navigation';
import { JobResultsContext } from '../../context/JobResultsContext';

const tips = [
  "Quantify achievements (e.g., +30% sales)",
  "Tailor skills to each JD",
  "Use keywords from the posting",
  "Show measurable impact first",
  "Keep it to 1 page if <10y exp.",
];

export default function ResumeUploadPanel() {
  const [tip, setTip] = useState(tips[0]);
  useEffect(() => {
    const id = setInterval(() => {
      setTip((t) => tips[(tips.indexOf(t) + 1) % tips.length]);
    }, 2500);
    return () => clearInterval(id);
  }, []);

  // Ideally listen to backend processing state
  const loading = false;

  return (
    <section id="upload" className="py-32 bg-surface">
      <div className="max-w-4xl mx-auto px-4 md:px-8">
        <motion.h2 
          className="text-center text-4xl md:text-5xl font-bold mb-16 text-textPrimary"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          Upload Your <span className="text-accent">Resume</span>
        </motion.h2>
        
        <motion.div 
          className="max-w-3xl mx-auto flex flex-col items-center justify-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
        >
        <div className="w-full flex flex-col items-center justify-center">
          <Tabs className="w-full max-w-lg mx-auto">
            <Tab title="Upload Resume">
              <ResumeUpload />
              {loading && (
                <div className="mt-8">
                  <Progress className="w-full" />
                    <p className="text-center text-sm mt-3 text-textSecondary animate-pulse">
                    {tip}
                  </p>
                </div>
              )}
            </Tab>
            <Tab title="Enter Manually">
              <ManualForm />
            </Tab>
          </Tabs>
        </div>
        </motion.div>
      </div>
    </section>
  );
}

function ManualForm() {
  const [name, setName] = useState('');
  const [education, setEducation] = useState('');
  const [skills, setSkills] = useState('');
  const [expTitle, setExpTitle] = useState('');
  const [expType, setExpType] = useState('');
  const [expStart, setExpStart] = useState('');
  const [expEnd, setExpEnd] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { setJobResults } = useContext(JobResultsContext);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      // Format the data as strings instead of JSON
      const experienceData = [{
        title: expTitle,
        company: '',
        type: expType,
        dates: expStart && expEnd ? `${expStart} to ${expEnd}` : '',
        details: ''
      }];

      // Create URLSearchParams instead of FormData
      const params = new URLSearchParams();
      params.append('use_llm', 'true');
      params.append('manual_skills', skills);
      // Send education as comma-separated string instead of JSON
      params.append('manual_education', education);
      // Send experience as a simple string
      params.append('manual_experience', expTitle);

      console.log('Submitting manual form with data:', {
        skills: skills,
        education: education,
        experience: experienceData
      });

      const res = await fetch('http://localhost:8000/match-resume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to submit form');
      }
      
      const data = await res.json();
      console.log('Received response:', data);
      
      if (data.matches && data.matches.length > 0) {
        // Update the job results in context
        setJobResults(data);
        // Navigate to results section
        window.location.href = '/#results';
      } else {
        throw new Error('No matching jobs found');
      }
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err.message || 'Failed to find matching jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleManualSubmit} className="space-y-6">
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        <div className="space-y-1">
          <label className="block text-sm font-medium text-textSecondary/80 mb-1.5">
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3.5 rounded-xl bg-surface/50 border border-accent/20 text-textPrimary placeholder-textSecondary/50 focus:border-accent focus:outline-none transition-all duration-300 focus:ring-2 focus:ring-accent/30"
            placeholder="John Doe"
            required
          />
        </div>
        
        <div className="space-y-1">
          <label className="block text-sm font-medium text-textSecondary/80 mb-1.5">
            Education <span className="text-xs text-textSecondary/60">(comma separated)</span>
          </label>
          <input
            type="text"
            value={education}
            onChange={(e) => setEducation(e.target.value)}
            className="w-full p-3.5 rounded-xl bg-surface/50 border border-accent/20 text-textPrimary placeholder-textSecondary/50 focus:border-accent focus:outline-none transition-all duration-300 focus:ring-2 focus:ring-accent/30"
            placeholder="BSc Computer Science, MSc AI"
            required
          />
        </div>
        
        <div className="space-y-1">
          <label className="block text-sm font-medium text-textSecondary/80 mb-1.5">
            Skills <span className="text-xs text-textSecondary/60">(comma separated)</span>
          </label>
          <input
            type="text"
            value={skills}
            onChange={(e) => setSkills(e.target.value)}
            className="w-full p-3.5 rounded-xl bg-surface/50 border border-accent/20 text-textPrimary placeholder-textSecondary/50 focus:border-accent focus:outline-none transition-all duration-300 focus:ring-2 focus:ring-accent/30"
            placeholder="JavaScript, React, Node.js"
            required
          />
        </div>
        
        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-medium text-textSecondary/80">Experience</h4>
          <div className="space-y-4 p-4 rounded-xl bg-surface/30 border border-accent/10">
            <div className="space-y-1">
              <input
                type="text"
                value={expTitle}
                onChange={(e) => setExpTitle(e.target.value)}
                placeholder="Job Title"
                className="w-full p-3.5 rounded-xl bg-surface/50 border border-accent/20 text-textPrimary placeholder-textSecondary/50 focus:border-accent focus:outline-none transition-all duration-300 focus:ring-2 focus:ring-accent/30"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <select
                  value={expType}
                  onChange={(e) => setExpType(e.target.value)}
                  className="w-full p-3.5 rounded-xl bg-surface/50 border border-accent/20 text-textPrimary focus:border-accent focus:outline-none transition-all duration-300 focus:ring-2 focus:ring-accent/30 appearance-none"
                >
                  <option value="">Select Type</option>
                  <option value="Full-time">Full-time</option>
                  <option value="Part-time">Part-time</option>
                  <option value="Internship">Internship</option>
                  <option value="Freelance">Freelance</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <input
                    type="date"
                    value={expStart}
                    onChange={(e) => setExpStart(e.target.value)}
                    className="w-full p-3 rounded-xl bg-surface/50 border border-accent/20 text-textPrimary focus:border-accent focus:outline-none transition-all duration-300 focus:ring-2 focus:ring-accent/30"
                  />
                </div>
                <div className="space-y-1">
                  <input
                    type="date"
                    value={expEnd}
                    onChange={(e) => setExpEnd(e.target.value)}
                    className="w-full p-3 rounded-xl bg-surface/50 border border-accent/20 text-textPrimary focus:border-accent focus:outline-none transition-all duration-300 focus:ring-2 focus:ring-accent/30"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      
      {error && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-400 text-sm p-3 bg-red-50/10 rounded-lg border border-red-400/20"
        >
          {error}
        </motion.div>
      )}
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="pt-2"
      >
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3.5 px-6 rounded-xl font-semibold text-white transition-all duration-300 ${
            loading 
              ? 'bg-gray-500 cursor-not-allowed' 
              : 'bg-gradient-to-r from-accent to-accentHover hover:shadow-lg hover:shadow-accent/20 hover:-translate-y-0.5 active:translate-y-0'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </span>
          ) : (
            'Submit Resume'
          )}
        </button>
      </motion.div>
    </form>
  );
}
