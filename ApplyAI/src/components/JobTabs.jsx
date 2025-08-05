"use client";
import { useContext, useState, useEffect } from 'react';
import { JobResultsContext } from '../context/JobResultsContext';
import JobList from './JobList';
import { Tabs, Tab } from './ui/tabs';
import Confetti from 'react-confetti';

export default function JobTabs() {
  const { jobResults } = useContext(JobResultsContext);
  const [activeTab, setActiveTab] = useState('Top Matches');
  const [showConfetti, setShowConfetti] = useState(false);
  const [employmentType, setEmploymentType] = useState('All');

  if (!jobResults || !jobResults.matches) {
    return <div>No job matches found. Please upload your resume.</div>;
  }

  // Filter jobs by employment type
  const filterByEmploymentType = job => {
    if (employmentType === 'All') return true;
    if (!job.employment_type) return false;
    return job.employment_type.toLowerCase() === employmentType.toLowerCase();
  };

  const topMatches = jobResults.matches
    .filter(job => job.compatibility > 50)
    .filter(filterByEmploymentType)
    .sort((a, b) => b.compatibility - a.compatibility);
  const allJobs = jobResults.matches
    .filter(filterByEmploymentType)
    .sort((a, b) => b.compatibility - a.compatibility);

  useEffect(() => {
    if (topMatches.length > 0 && !showConfetti) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 10000);
      return () => clearTimeout(timer);
    }
  }, [topMatches.length]);

  return (
    <div className="relative">
      {/* Employment Type Filter */}
      <div className="flex justify-end mb-4">
        <label htmlFor="employment-type" className="mr-2 text-white font-medium">Employment Type:</label>
        <select
          id="employment-type"
          value={employmentType}
          onChange={e => setEmploymentType(e.target.value)}
          className="rounded px-3 py-1 bg-gray-800 text-white border border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="All">All</option>
          <option value="Full Time">Full Time</option>
          <option value="Part Time">Part Time</option>
          <option value="Internship">Internship</option>
        </select>
      </div>
      {showConfetti && (
        <Confetti
          width={window.innerWidth}
          height={window.innerHeight}
          numberOfPieces={120}
          gravity={0.2}
          initialVelocityY={6}
          wind={0.01}
          opacity={0.85}
          colors={["#a78bfa", "#6366f1", "#fff", "#60a5fa", "#c7d2fe"]}
          confettiSource={{ x: 0, y: 0, w: window.innerWidth, h: 0 }}
          recycle={false}
        />
      )}
      <Tabs defaultIndex={0}>
        <Tab title="Top Matches">
          <JobList jobs={topMatches} />
        </Tab>
        <Tab title="All Jobs">
          <JobList jobs={allJobs} />
        </Tab>
      </Tabs>
    </div>
  );
} 

