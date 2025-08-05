export default function ScoreBreakdown({ job }) {
  return (
    <div className="my-6 p-4 bg-gray-50 rounded-lg">
      <h3 className="font-semibold text-gray-900 mb-3">Score Breakdown</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{job.skill_score ?? '-'}%</div>
          <div className="text-sm text-gray-600">Skill Score</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{job.exp_score ?? '-'}%</div>
          <div className="text-sm text-gray-600">Experience Score</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{job.edu_score ?? '-'}%</div>
          <div className="text-sm text-gray-600">Education Score</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-primary">{job.compatibility ?? '-'}%</div>
          <div className="text-sm text-gray-600">Final Score</div>
        </div>
      </div>
    </div>
  );
} 