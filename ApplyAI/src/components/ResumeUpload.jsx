"use client";
import { useRef, useState, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from './ui/Button';
import { Tabs, Tab } from './ui/tabs';
import { useAuth } from '../context/AuthContext';
import { Progress } from './ui/Progress';
import { JobResultsContext } from '../context/JobResultsContext';
// import ProModal from './ProModal';

// Utility for currency formatting (optional, for salary field)
function formatSalary(val) {
  if (!val) return '';
  return val.replace(/[^\d]/g, '');
}

export default function ResumeUpload() {
  // Tips array must be declared first
  const tips = [
    "Tailor your resume for each job application.",
    "Highlight your projects and internships.",
    "Keep learning new technologies!",
    "Networking is key—connect with professionals.",
    "Showcase your GitHub and portfolio.",
    "Stay positive and persistent—your dream job is waiting!",
    "Practice coding interviews regularly.",
    "Be confident in your skills and achievements.",
    "Soft skills matter—communication is important!",
    "Apply to jobs even if you don't meet 100% of the requirements."
  ];

  const fileInput = useRef();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [salary, setSalary] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [manualSkills, setManualSkills] = useState('');
  const [manualEducation, setManualEducation] = useState([
    { school: '', degree: '', dates: '' }
  ]);
  const [manualExperiences, setManualExperiences] = useState([
    { role: '', company: '', dates: '', description: '' }
  ]);
  const { setJobResults } = useContext(JobResultsContext);
  const router = useRouter();
  const { user, signInWithGoogle } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authError, setAuthError] = useState('');
  const [shownTips, setShownTips] = useState([]);
  const [currentTip, setCurrentTip] = useState(tips[0]);
  const [progress, setProgress] = useState(0);
  const progressInterval = useRef(null);
  // const [showProModal, setShowProModal] = useState(false);

  useEffect(() => {
    if (!loading) return;
    let availableTips = tips.filter(tip => !shownTips.includes(tip));
    if (availableTips.length === 0) {
      setShownTips([]);
      availableTips = tips;
    }
    let i = 0;
    setCurrentTip(availableTips[Math.floor(Math.random() * availableTips.length)]);
    const interval = setInterval(() => {
      let newAvailableTips = tips.filter(tip => !shownTips.includes(tip));
      if (newAvailableTips.length === 0) {
        setShownTips([]);
        newAvailableTips = tips;
      }
      const nextTip = newAvailableTips[Math.floor(Math.random() * newAvailableTips.length)];
      setCurrentTip(nextTip);
      setShownTips(prev => [...prev, nextTip]);
      i++;
    }, 3000);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (loading) {
      setProgress(0);
      document.body.classList.add('modal-blur');
      document.body.style.overflow = 'hidden';
      progressInterval.current = setInterval(() => {
        setProgress(prev => {
          if (prev < 98) {
            return Math.min(prev + Math.random() * 2 + 1, 98);
          }
          return prev;
        });
      }, 350);
    } else {
      setProgress(100);
      setTimeout(() => setProgress(0), 500);
      document.body.classList.remove('modal-blur');
      document.body.style.overflow = '';
      if (progressInterval.current) clearInterval(progressInterval.current);
    }
    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current);
      document.body.classList.remove('modal-blur');
      document.body.style.overflow = '';
    };
  }, [loading]);

  // useEffect(() => {
  //   if (showProModal) {
  //     document.body.classList.add('modal-blur');
  //     document.body.style.overflow = 'hidden';
  //   } else {
  //     document.body.classList.remove('modal-blur');
  //     document.body.style.overflow = '';
  //   }
  //   return () => {
  //     document.body.classList.remove('modal-blur');
  //     document.body.style.overflow = '';
  //   };
  // }, [showProModal]);

  const handleEducationChange = (idx, field, value) => {
    setManualEducation(eds => eds.map((ed, i) => i === idx ? { ...ed, [field]: value } : ed));
  };
  const addEducation = () => setManualEducation(eds => [...eds, { school: '', degree: '', dates: '' }]);
  const removeEducation = idx => setManualEducation(eds => eds.length > 1 ? eds.filter((_, i) => i !== idx) : eds);

  const handleExperienceChange = (idx, field, value) => {
    setManualExperiences(exps => exps.map((ex, i) => i === idx ? { ...ex, [field]: value } : ex));
  };
  const addExperience = () => setManualExperiences(exps => [...exps, { role: '', company: '', dates: '', description: '' }]);
  const removeExperience = idx => setManualExperiences(exps => exps.length > 1 ? exps.filter((_, i) => i !== idx) : exps);

  function getViewedJobsKey(user) {
    return user ? `viewedJobs_${user.uid}` : 'viewedJobs';
  }
  function hasQuota(user) {
    if (typeof window === 'undefined') return true;
    if (!user) return true; // Always allow if not signed in (sign-in modal will handle it)
    const viewed = JSON.parse(localStorage.getItem(getViewedJobsKey(user)) || '[]');
    return viewed.length < 2;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    // if (!hasQuota(user)) {
    //   setShowProModal(true);
    //   return;
    // }
    const file = fileInput.current.files[0];
    if (!file && !manualMode) {
      setError('Please select a resume file.');
      console.warn('No file selected for upload.');
      return;
    }
    setLoading(true);
    const formData = new FormData();
    if (file) formData.append('resume', file);
    formData.append('use_llm', 'true'); // Always use LLM for best results
    if (salary) {
      formData.append('salary', salary);
    }
    if (manualMode) {
      formData.append('manual_skills', manualSkills);
      formData.append('manual_education', JSON.stringify(manualEducation));
      formData.append('manual_experiences', JSON.stringify(manualExperiences));
    }
    try {
      console.log('Uploading resume to backend...');
      const res = await fetch('http://localhost:8000/match-resume', {
        method: 'POST',
        body: formData,
      });
      console.log('Received response:', res);
      if (!res.ok) {
        const text = await res.text();
        console.error('Backend error:', text);
        throw new Error('Failed to get job matches.');
      }
      const data = await res.json();
      console.log('Job matches data:', data);
      if (data.matches && data.matches.length > 0) {
        setJobResults(data);
        router.push('/jobs');
        // After successful job view, increment quota for this user
        const viewed = JSON.parse(localStorage.getItem(getViewedJobsKey(user)) || '[]');
        // Add logic to push new job id if needed, if this is where job views are tracked
        // localStorage.setItem(getViewedJobsKey(user), JSON.stringify(viewed));
      } else {
        setManualMode(true);
        setError('We could not extract enough information from your resume. Please enter your skills and work experience manually.');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong.');
      console.error('Error during resume upload:', err);
    } finally {
      setLoading(false);
      console.log('Upload process finished.');
    }
  };

  return (
    <>
      {/* Main Content (blurred when modal is open) */}
      <div className={/* showProModal ? 'modal-blur pointer-events-none select-none' : */ '' /* showProModal ? 'modal-blur pointer-events-none select-none' : '' */}>
        {/* Progress Bar Modal */}
        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-xl">
            <div
              className="rounded-3xl p-12 max-w-xl w-full flex flex-col items-center border border-white/20 shadow-2xl"
              style={{
                background: "rgba(30, 41, 59, 0.55)",
                boxShadow: "0 8px 64px 0 rgba(168,85,247,0.25), 0 1.5px 8px 0 rgba(0,0,0,0.15)",
                backdropFilter: "blur(18px)",
              }}
            >
              <p className="text-center text-xl mb-8 text-white font-semibold drop-shadow-lg">
                {currentTip}
              </p>
              <div className="w-full mb-4">
                <div className="w-full h-6 bg-gray-900 rounded-full shadow-lg overflow-hidden flex items-center">
                  <div
                    className="h-6 bg-gradient-to-r from-purple-500 to-fuchsia-500 transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                      minWidth: progress > 0 ? '0.5rem' : 0,
                      borderRadius: '9999px',
                      transition: 'width 0.8s cubic-bezier(0.4,0,0.2,1)'
                    }}
                  />
                </div>
                <span className="text-white mt-2 block text-center text-sm font-mono">{Math.round(progress)}%</span>
              </div>
              <span className="text-textSecondary text-base mt-4 font-medium">Processing your resume...</span>
            </div>
          </div>
        )}
        {/* Main Form UI */}
        <div className={`max-w-lg mx-auto bg-[#18181b] rounded-2xl shadow-2xl p-10 border border-[#2a2a2e] ${loading ? 'blur-sm pointer-events-none select-none' : ''}`}>
          {showAuthModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
              <div className="bg-white rounded-lg p-8 max-w-sm w-full text-center">
                <h2 className="text-2xl font-bold mb-4 text-gray-900">Sign In Required</h2>
                <p className="mb-6 text-gray-700">Please sign in to upload your resume and get job matches.</p>
                {authError && <p className="text-red-500 mb-4">{authError}</p>}
                <button
                  className="bg-purple-600 text-white px-6 py-2 rounded font-semibold hover:bg-purple-700 transition mb-2 w-full"
                  onClick={async () => {
                    setAuthError('');
                    const result = await signInWithGoogle();
                    if (!result.success) {
                      setAuthError(result.message);
                    } else {
                      setShowAuthModal(false);
                    }
                  }}
                >
                  Sign in with Google
                </button>
                <button
                  className="mt-2 text-gray-500 underline w-full"
                  onClick={() => { setShowAuthModal(false); setAuthError(''); }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="mb-6">
              <label htmlFor="resume" className="block text-lg font-semibold text-white mb-2">
                Upload Resume
              </label>
              <input
                type="file"
                id="resume"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                ref={fileInput}
                className="block w-full text-sm text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gradient-to-r from-purple-500 to-fuchsia-500 file:text-white hover:file:bg-purple-600/90 transition"
                disabled={manualMode}
              />
              <p className="text-xs text-gray-500 mt-2">
                Supported formats: PDF, DOC, DOCX, TXT, PNG, JPG, JPEG
              </p>
            </div>

            <div className="mb-6">
              <label htmlFor="salary" className="block text-lg font-semibold text-white mb-2">
                Salary <span className="text-gray-400 text-base font-normal">(optional)</span>
              </label>
              <input
                type="text"
                id="salary"
                inputMode="numeric"
                pattern="[0-9]*"
                placeholder="e.g. 120000"
                value={salary}
                onChange={e => setSalary(formatSalary(e.target.value))}
                className="block w-full rounded-lg bg-[#23232b] border border-[#363646] text-white px-4 py-2 text-lg focus:border-purple-500 focus:outline-none transition"
                disabled={manualMode}
              />
              <p className="text-xs text-gray-500 mt-2">Enter your target salary (optional, for better job matches)</p>
            </div>

            {manualMode && (
              <div className="space-y-6">
                <Tabs defaultIndex={0}>
                  <Tab title="Skills">
                    <div>
                      <label htmlFor="manual_skills" className="block text-lg font-semibold text-white mb-2">
                        Skills <span className="text-gray-400 text-base font-normal">(comma separated)</span>
                      </label>
                      <input
                        type="text"
                        id="manual_skills"
                        placeholder="e.g. Python, React, SQL"
                        value={manualSkills}
                        onChange={e => setManualSkills(e.target.value)}
                        className="block w-full rounded-lg bg-[#23232b] border border-[#363646] text-white px-4 py-2 text-lg focus:border-purple-500 focus:outline-none transition"
                        required={manualMode}
                      />
                    </div>
                  </Tab>
                  <Tab title="Education">
                    <div>
                      {manualEducation.map((ed, idx) => (
                        <div key={idx} className="mb-4 border-b border-[#363646] pb-4">
                          <div className="flex gap-2 mb-2">
                            <input
                              type="text"
                              placeholder="School/University"
                              value={ed.school}
                              onChange={e => handleEducationChange(idx, 'school', e.target.value)}
                              className="flex-1 rounded bg-[#23232b] border border-[#363646] text-white px-3 py-2"
                            />
                            <input
                              type="text"
                              placeholder="Degree"
                              value={ed.degree}
                              onChange={e => handleEducationChange(idx, 'degree', e.target.value)}
                              className="flex-1 rounded bg-[#23232b] border border-[#363646] text-white px-3 py-2"
                            />
                            <input
                              type="text"
                              placeholder="Dates (e.g. 2018-2022)"
                              value={ed.dates}
                              onChange={e => handleEducationChange(idx, 'dates', e.target.value)}
                              className="flex-1 rounded bg-[#23232b] border border-[#363646] text-white px-3 py-2"
                            />
                            <button type="button" onClick={() => removeEducation(idx)} className="text-red-400 font-bold ml-2">&times;</button>
                          </div>
                        </div>
                      ))}
                      <button type="button" onClick={addEducation} className="text-purple-400 font-semibold">+ Add Education</button>
                    </div>
                  </Tab>
                  <Tab title="Experience">
                    <div>
                      {manualExperiences.map((ex, idx) => (
                        <div key={idx} className="mb-4 border-b border-[#363646] pb-4">
                          <div className="flex gap-2 mb-2">
                            <input
                              type="text"
                              placeholder="Role/Title"
                              value={ex.role}
                              onChange={e => handleExperienceChange(idx, 'role', e.target.value)}
                              className="flex-1 rounded bg-[#23232b] border border-[#363646] text-white px-3 py-2"
                            />
                            <input
                              type="text"
                              placeholder="Company"
                              value={ex.company}
                              onChange={e => handleExperienceChange(idx, 'company', e.target.value)}
                              className="flex-1 rounded bg-[#23232b] border border-[#363646] text-white px-3 py-2"
                            />
                            <input
                              type="text"
                              placeholder="Dates (e.g. 2020-2022)"
                              value={ex.dates}
                              onChange={e => handleExperienceChange(idx, 'dates', e.target.value)}
                              className="flex-1 rounded bg-[#23232b] border border-[#363646] text-white px-3 py-2"
                            />
                            <button type="button" onClick={() => removeExperience(idx)} className="text-red-400 font-bold ml-2">&times;</button>
                          </div>
                          <textarea
                            placeholder="Description (optional)"
                            value={ex.description}
                            onChange={e => handleExperienceChange(idx, 'description', e.target.value)}
                            className="block w-full rounded bg-[#23232b] border border-[#363646] text-white px-3 py-2 min-h-[60px]"
                          />
                        </div>
                      ))}
                      <button type="button" onClick={addExperience} className="text-purple-400 font-semibold">+ Add Experience</button>
                    </div>
                  </Tab>
                </Tabs>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full text-lg font-semibold py-3 rounded-xl bg-gradient-to-r from-purple-500 to-fuchsia-500 shadow-lg hover:from-purple-600 hover:to-fuchsia-600 transition"
              size="lg"
            >
              {loading ? 'Uploading...' : manualMode ? 'Submit Manually' : 'Upload Resume'}
            </Button>
          </form>
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}
        </div>
      </div>
      {/* Modal (always outside the blurred content) */}
      {/* <ProModal open={showProModal} onClose={() => setShowProModal(false)} /> */}
    </>
  );
} 