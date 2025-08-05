export default function SkillMatchList({ job }) {
  const matched = job.matched_skills || [];
  const missing = job.missing_skills || [];
  
  if (!matched.length && !missing.length) {
    return (
      <div className="my-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800 font-medium">
          Matched and missing skills are not available for this job.<br />
          Please check your resume and try again, or contact support if this persists.
        </p>
      </div>
    );
  }
  
  return (
    <div className="my-6 grid md:grid-cols-2 gap-6">
      <div className="p-4 bg-green-50 rounded-lg">
        <h3 className="font-semibold text-green-900 mb-3">Matched Skills</h3>
        {matched.length > 0 ? (
          <ul className="space-y-1">
            {matched.map(skill => (
              <li key={skill} className="text-green-700 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                {skill}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-green-700">No skills matched</p>
        )}
      </div>
      
      <div className="p-4 bg-red-50 rounded-lg">
        <h3 className="font-semibold text-red-900 mb-3">Missing Skills</h3>
        {missing.length > 0 ? (
          <ul className="space-y-1">
            {missing.map(skill => (
              <li key={skill} className="text-red-700 flex items-center">
                <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                {skill}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-red-700">No missing skills</p>
        )}
      </div>
    </div>
  );
} 