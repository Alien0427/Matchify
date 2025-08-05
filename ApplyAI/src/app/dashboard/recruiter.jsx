"use client";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import { Briefcase, Plus, UserCircle, MapPin, Edit, Trash2, Users } from 'lucide-react';

export default function RecruiterDashboard() {
  const [recruiterId, setRecruiterId] = useState("");
  const [profile, setProfile] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobForm, setJobForm] = useState({
    company: "",
    title: "",
    skills: "",
    description: "",
    employment: "full-time",
    location: ""
  });
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showProModal, setShowProModal] = useState(false);
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [activeApplicant, setActiveApplicant] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messageTemplates = [
    "Thank you for applying. We will review your application and get back to you soon.",
    "Congratulations! You have been shortlisted for an interview.",
    "We regret to inform you that you have not been selected for this position.",
    "Please provide your availability for a quick call."
  ];
  const [selectedApplicants, setSelectedApplicants] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(messageTemplates[0]);
  const [bulkMsgSuccess, setBulkMsgSuccess] = useState("");
  const [bulkMsgError, setBulkMsgError] = useState("");

  const { recruiterId: contextRecruiterId, role } = useAuth ? useAuth() : {};

  // Auto-fill recruiterId from context if available
  useEffect(() => {
    if (contextRecruiterId && contextRecruiterId !== recruiterId) {
      setRecruiterId(contextRecruiterId);
    }
  }, [contextRecruiterId]);

  useEffect(() => {
    if (recruiterId) {
      fetch(`http://localhost:8000/recruiter/profile?recruiterId=${recruiterId}`)
        .then(res => res.json())
        .then(data => { if (data.success) setProfile(data.profile); else setError(data.error); });
      fetch(`http://localhost:8000/recruiter/jobs?recruiterId=${recruiterId}`)
        .then(res => res.json())
        .then(data => { if (data.success) setJobs(data.jobs); else setError(data.error); });
    }
  }, [recruiterId, success]);

  // Remove useEffect for jobForm/profile/showJobForm
  // Add handleOpenJobForm to prefill company only if all fields are empty
  const handleOpenJobForm = () => {
    setShowJobForm(true);
    setJobForm(prev => {
      const isEmpty = !prev.company && !prev.title && !prev.skills && !prev.description && !prev.location;
      if (isEmpty && profile?.companyName) {
        return { ...prev, company: profile.companyName };
      }
      return prev;
    });
  };

  const handleJobFormChange = useCallback(e => {
    const { name, value } = e.target;
    setJobForm(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  const handleCreateJob = async e => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const jobData = {
        ...jobForm,
        skills: jobForm.skills.split(',').map(s => s.trim()),
        recruiterId
      };
      const res = await fetch("http://localhost:8000/recruiter/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(jobData)
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setSuccess("Job created!");
      setShowJobForm(false);
      setJobForm({
        company: "",
        title: "",
        skills: "",
        description: "",
        employment: "full-time",
        location: ""
      });
    } catch (err) {
      setError(err.message);
    }
  };

  const handleViewApplicants = async (jobId) => {
    setSelectedJob(jobId);
    setApplicants([]);
    setError("");
    setActiveApplicant(null);
    try {
      const res = await fetch(`http://localhost:8000/job/applicants?jobId=${jobId}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setApplicants(data.applicants);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpgradePro = async () => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`http://localhost:8000/recruiter/profile?recruiterId=${recruiterId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPro: true })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setShowProModal(false);
      setSuccess("Upgraded to Pro!");
      // Refetch profile
      fetch(`http://localhost:8000/recruiter/profile?recruiterId=${recruiterId}`)
        .then(res => res.json())
        .then(data => { if (data.success) setProfile(data.profile); });
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchMessages = async (jobId, applicantId) => {
    setLoadingMessages(true);
    setMessages([]);
    try {
      const res = await fetch(`http://localhost:8000/messages?jobId=${jobId}&recruiterId=${recruiterId}&applicantId=${applicantId}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setMessages(data.messages);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleOpenMessaging = (jobId, applicant) => {
    setActiveApplicant(applicant);
    fetchMessages(jobId, applicant.id);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;
    try {
      const res = await fetch("http://localhost:8000/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobId: selectedJob,
          recruiterId,
          applicantId: activeApplicant.id,
          sender: "recruiter",
          content: messageText
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setMessageText("");
      fetchMessages(selectedJob, activeApplicant.id);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleApplicantSelect = (applicantId) => {
    setSelectedApplicants(prev =>
      prev.includes(applicantId) ? prev.filter(id => id !== applicantId) : [...prev, applicantId]
    );
  };
  const handleBulkSend = async () => {
    setBulkMsgSuccess("");
    setBulkMsgError("");
    try {
      const res = await fetch("http://localhost:8000/messages/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recruiterId,
          jobId: selectedJob,
          applicantIds: selectedApplicants,
          template: selectedTemplate
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setBulkMsgSuccess("Bulk message sent!");
      setSelectedApplicants([]);
    } catch (err) {
      setBulkMsgError(err.message);
    }
  };

  const statusOptions = ["Applied", "Reviewed", "Interview", "Rejected", "Hired"];

  const handleStatusChange = async (applicantId, newStatus) => {
    setError("");
    try {
      const res = await fetch("http://localhost:8000/applicant/status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicantId, status: newStatus })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      // Refresh applicants
      handleViewApplicants(selectedJob);
    } catch (err) {
      setError(err.message);
    }
  };

  const router = useRouter();

  // Modal for job posting
  const renderJobForm = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl overflow-hidden">
        <div className="bg-gray-900 p-6 text-white">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">Create New Job Posting</h2>
            <button
              onClick={() => setShowJobForm(false)}
              className="text-white/80 hover:text-white text-2xl font-bold"
              aria-label="Close"
            >
              &times;
            </button>
          </div>
        </div>
        
        <form onSubmit={handleCreateJob} className="p-6 space-y-8 max-h-[80vh] overflow-y-auto bg-gray-50">
          <div className="grid grid-cols-1 gap-8">
            <div className="space-y-1">
              <label className="block text-base font-semibold text-gray-800">
                Company Name <span className="text-red-600">*</span>
              </label>
              <p className="text-sm text-gray-500 mb-2">Enter the company name as it should appear on the job posting</p>
              <input
                type="text"
                name="company"
                value={jobForm.company}
                onChange={handleJobFormChange}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                placeholder="e.g. Tech Corp Inc."
                required
              />
            </div>

            <div className="space-y-1">
              <label className="block text-base font-semibold text-gray-800">
                Job Title <span className="text-red-600">*</span>
              </label>
              <p className="text-sm text-gray-500 mb-2">Be specific about the role</p>
              <input
                type="text"
                name="title"
                value={jobForm.title}
                onChange={handleJobFormChange}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                placeholder="e.g. Senior Frontend Developer"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="block text-base font-semibold text-gray-800">
                  Employment Type <span className="text-red-600">*</span>
                </label>
                <select
                  name="employment"
                  value={jobForm.employment}
                  onChange={handleJobFormChange}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                >
                  <option value="full-time">Full Time</option>
                  <option value="part-time">Part Time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-base font-semibold text-gray-800">
                  Location <span className="text-red-600">*</span>
                </label>
                <p className="text-sm text-gray-500 mb-2">City, State or 'Remote'</p>
                <input
                  type="text"
                  name="location"
                  value={jobForm.location}
                  onChange={handleJobFormChange}
                  className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                  placeholder="e.g. New York, NY or Remote"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="block text-base font-semibold text-gray-800">
                Required Skills <span className="text-red-600">*</span>
              </label>
              <p className="text-sm text-gray-500 mb-2">Separate multiple skills with commas</p>
              <input
                type="text"
                name="skills"
                value={jobForm.skills}
                onChange={handleJobFormChange}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
                placeholder="e.g. React, Node.js, TypeScript, UI/UX"
                required
              />
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-base font-semibold text-gray-800">
                  Job Description <span className="text-red-600">*</span>
                </label>
                <span className="text-sm text-gray-500">Markdown supported</span>
              </div>
              <p className="text-sm text-gray-500 mb-2">Include responsibilities, requirements, and benefits</p>
              <textarea
                name="description"
                value={jobForm.description}
                onChange={handleJobFormChange}
                rows={8}
                className="w-full px-4 py-3 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white font-sans"
                placeholder="Enter detailed job description..."
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowJobForm(false)}
              className="px-6 py-3 text-base font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 text-base font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
            >
              Create Job Posting
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  // Modal for applicants
  const ApplicantsModal = () => (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-2xl relative">
        <button
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 text-2xl"
          onClick={() => setSelectedJob(null)}
          aria-label="Close"
        >
          &times;
        </button>
        <h3 className="text-2xl font-bold mb-6 text-accent flex items-center gap-2">
          <Users className="w-6 h-6" /> Applicants
        </h3>
        {applicants.length === 0 ? (
          <div className="text-gray-500 text-lg text-center py-8">No applicants yet for this job.</div>
        ) : (
          <table className="w-full text-left border-separate border-spacing-y-2">
            <thead>
              <tr className="text-accent text-lg">
                <th className="py-2">Name</th>
                <th className="py-2">Email</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {applicants.map(app => (
                <tr key={app.id} className="bg-accent/5 hover:bg-accent/10 rounded-lg">
                  <td className="py-2 px-3 font-semibold text-textPrimary">{app.name || 'N/A'}</td>
                  <td className="py-2 px-3 text-textSecondary">{app.email || 'N/A'}</td>
                  <td className="py-2 px-3">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent capitalize">{app.status || 'Applied'}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      {/* Profile Header */}
      {profile && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 p-8 bg-gradient-to-r from-purple-900/10 to-fuchsia-900/10 rounded-2xl shadow-lg border border-accent/10">
          <div className="flex items-center gap-6">
            <UserCircle className="w-16 h-16 text-accent drop-shadow-lg" />
            <div>
              <h2 className="text-3xl font-extrabold text-textPrimary mb-1">Hi, {profile.fullName || "Recruiter"}</h2>
              <div className="text-lg text-textSecondary font-medium">{profile.companyName}</div>
              <div className="text-sm text-gray-500 mt-1">{profile.companyEmail}</div>
            </div>
          </div>
          <button
            className="bg-accent hover:bg-accentHover text-white font-semibold px-6 py-2 rounded-xl shadow-neon transition-all duration-300"
            onClick={() => router.push("/dashboard/recruiter/profile")}
          >
            Profile
          </button>
        </div>
      )}
      {/* Post Job Button */}
      <div className="flex justify-between items-center mb-8">
        <h3 className="text-2xl font-bold text-textPrimary">Your Posted Jobs</h3>
        <button
          className="flex items-center gap-2 bg-accent hover:bg-accentHover text-white font-semibold px-5 py-2 rounded-xl shadow-neon transition-all duration-300"
          onClick={handleOpenJobForm}
        >
          <Plus className="w-5 h-5" /> Post New Job
        </button>
      </div>
      {/* Job Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {jobs.length === 0 ? (
          <div className="col-span-2 text-center text-gray-400 text-lg py-12">No jobs posted yet.</div>
        ) : (
          jobs.map(job => (
            <div key={job.id} className="bg-white rounded-2xl shadow-md border border-accent/10 p-6 flex flex-col gap-3 hover:shadow-xl transition-all duration-200">
              <div className="flex items-center gap-3 mb-2">
                <Briefcase className="w-6 h-6 text-accent" />
                <span className="text-xl font-bold text-textPrimary">{job.title}</span>
                <span className="ml-auto px-3 py-1 rounded-full text-xs font-semibold bg-accent/10 text-accent capitalize">{job.employment}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                <MapPin className="w-4 h-4" /> {job.location}
              </div>
              <div className="text-gray-700 text-base mb-2 line-clamp-3">{job.description}</div>
              <div className="flex flex-wrap gap-2 mb-2">
                {Array.isArray(job.skills) && job.skills.map((skill, idx) => (
                  <span key={idx} className="bg-accent/10 text-accent px-3 py-1 rounded-full text-xs font-medium">{skill}</span>
                ))}
              </div>
              <div className="flex gap-3 mt-auto">
                <button
                  className="flex items-center gap-1 bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-4 py-2 rounded-lg font-semibold shadow transition"
                  onClick={() => handleViewApplicants(job.id)}
                >
                  <Users className="w-4 h-4" /> Applicants
                </button>
                {/* <button className="flex items-center gap-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-lg font-semibold shadow transition"><Edit className="w-4 h-4" /> Edit</button> */}
                {/* <button className="flex items-center gap-1 bg-red-100 text-red-700 px-3 py-1 rounded-lg font-semibold shadow transition"><Trash2 className="w-4 h-4" /> Delete</button> */}
              </div>
            </div>
          ))
        )}
      </div>
      {/* Job Form Modal */}
      {showJobForm && renderJobForm()}
      {/* Applicants Modal */}
      {selectedJob && <ApplicantsModal />}
      {/* Feedback/Error Messages */}
      {error && <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-3 rounded-xl shadow-lg z-50">{error}</div>}
      {success && <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-lg z-50">{success}</div>}
    </div>
  );
}