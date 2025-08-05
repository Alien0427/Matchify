"use client";
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { Button } from '../../components/ui/Button';

export default function ApplicantsPage({ params }) {
  const { user } = useAuth();
  const router = useRouter();
  const jobId = params?.jobId;
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApplicant, setSelectedApplicant] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!user || !jobId) return;
    
    const fetchApplicants = async () => {
      try {
        const response = await fetch(`http://localhost:8000/job/applicants/${jobId}?recruiter_id=${user.uid}`);
        const data = await response.json();
        
        if (data.success) {
          setApplicants(data.applicants || []);
        } else {
          setError(data.error || 'Failed to fetch applicants');
        }
      } catch (err) {
        setError('An error occurred while fetching applicants');
        console.error('Error fetching applicants:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchApplicants();
  }, [user, jobId]);

  const filteredApplicants = applicants.filter(applicant => {
    const matchesStatus = statusFilter === 'all' || applicant.status === statusFilter;
    const matchesSearch = 
      applicant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      applicant.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const updateApplicantStatus = async (applicationId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:8000/job/update-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          status: newStatus,
          recruiterId: user.uid
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setApplicants(applicants.map(applicant => 
          applicant.application_id === applicationId 
            ? { ...applicant, status: newStatus } 
            : applicant
        ));
        
        if (selectedApplicant?.application_id === applicationId) {
          setSelectedApplicant({ ...selectedApplicant, status: newStatus });
        }
      } else {
        alert('Failed to update status: ' + (data.error || 'Unknown error'));
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status. Please try again.');
    }
  };

  const downloadResume = (resumeUrl) => {
    // In a real app, you would generate a pre-signed URL or serve the file directly
    window.open(`http://localhost:8000${resumeUrl}`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Applicants</h1>
          <p className="mt-2 text-gray-600">
            {applicants.length} total applicant{applicants.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button 
          onClick={() => router.back()}
          variant="outline"
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Back to Jobs
        </Button>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-8">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Filter Applicants</h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
            <div className="sm:col-span-3">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700">Search</label>
              <input
                type="text"
                name="search"
                id="search"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="sm:col-span-3">
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
              <select
                id="status"
                name="status"
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                <option value="applied">Applied</option>
                <option value="reviewed">Reviewed</option>
                <option value="interviewed">Interviewed</option>
                <option value="hired">Hired</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Applicant List */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Applicants</h3>
            </div>
            <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
              {filteredApplicants.length > 0 ? (
                filteredApplicants.map((applicant) => (
                  <div 
                    key={applicant.application_id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedApplicant?.application_id === applicant.application_id ? 'bg-purple-50' : ''
                    }`}
                    onClick={() => setSelectedApplicant(applicant)}
                  >
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                        <span className="text-purple-600 font-medium">
                          {applicant.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                        </span>
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">{applicant.name}</p>
                        <p className="text-sm text-gray-500">{applicant.email}</p>
                      </div>
                      <div className="ml-auto">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          applicant.status === 'hired' ? 'bg-green-100 text-green-800' :
                          applicant.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          applicant.status === 'interviewed' ? 'bg-blue-100 text-blue-800' :
                          applicant.status === 'reviewed' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-gray-500">
                  No applicants found matching your criteria.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Applicant Details */}
        <div className="lg:col-span-2">
          {selectedApplicant ? (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    {selectedApplicant.name}
                  </h3>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => downloadResume(selectedApplicant.resume_url)}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                    >
                      Download Resume
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      onClick={() => {
                        // In a real app, this would open an email client
                        window.location.href = `mailto:${selectedApplicant.email}?subject=Regarding your application`;
                      }}
                    >
                      Contact
                    </Button>
                  </div>
                </div>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  {selectedApplicant.email}
                </p>
                <div className="mt-4">
                  <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    selectedApplicant.status === 'hired' ? 'bg-green-100 text-green-800' :
                    selectedApplicant.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    selectedApplicant.status === 'interviewed' ? 'bg-blue-100 text-blue-800' :
                    selectedApplicant.status === 'reviewed' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedApplicant.status.charAt(0).toUpperCase() + selectedApplicant.status.slice(1)}
                  </span>
                  <span className="ml-2 text-sm text-gray-500">
                    Applied on {new Date(selectedApplicant.applied_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="px-4 py-5 sm:p-6">
                <div className="border-b border-gray-200 pb-5 mb-5">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Application Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {['applied', 'reviewed', 'interviewed', 'hired', 'rejected'].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => updateApplicantStatus(selectedApplicant.application_id, status)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          selectedApplicant.status === status
                            ? 'bg-purple-100 text-purple-800 border border-purple-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                
                {selectedApplicant.notes && (
                  <div className="mt-6">
                    <h4 className="text-md font-medium text-gray-900 mb-2">Notes</h4>
                    <div className="bg-gray-50 p-4 rounded-md">
                      <p className="text-sm text-gray-700 whitespace-pre-line">{selectedApplicant.notes}</p>
                    </div>
                  </div>
                )}
                
                <div className="mt-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Add Note</h4>
                  <textarea
                    rows={3}
                    className="shadow-sm focus:ring-purple-500 focus:border-purple-500 block w-full sm:text-sm border border-gray-300 rounded-md"
                    placeholder="Add private notes about this applicant..."
                    defaultValue={selectedApplicant.notes || ''}
                    onBlur={async (e) => {
                      try {
                        const response = await fetch(`http://localhost:8000/job/update-status`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            applicationId: selectedApplicant.application_id,
                            notes: e.target.value,
                            recruiterId: user.uid
                          })
                        });
                        
                        const data = await response.json();
                        
                        if (data.success) {
                          setSelectedApplicant({
                            ...selectedApplicant,
                            notes: e.target.value
                          });
                        }
                      } catch (err) {
                        console.error('Error updating notes:', err);
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg h-full flex items-center justify-center">
              <div className="text-center p-8">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No applicant selected</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select an applicant from the list to view details
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
