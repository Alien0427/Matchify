export default function JobCard({ job }) {
  return (
    <article
      tabIndex={0}
      aria-label={`Job card for ${job.title} at ${job.company}`}
      className="rounded-2xl p-6 mb-6 bg-gradient-to-br from-white/5 via-purple-900/10 to-black/30 border border-transparent hover:border-purple-500/60 shadow-[0_4px_32px_0_rgba(168,85,247,0.10)] hover:shadow-[0_0_32px_4px_rgba(168,85,247,0.18)] transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500/60 backdrop-blur-md group"
    >
      <header className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="text-2xl font-bold text-white mb-1 drop-shadow-sm group-hover:text-purple-300 transition-colors duration-200">{job.title}</h3>
          <div className="text-purple-300 text-base font-medium mb-1">{job.company}</div>
        </div>
        <div className={`ml-4 px-4 py-2 rounded-full font-bold text-lg shadow-md bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white drop-shadow-[0_0_8px_rgba(168,85,247,0.7)] border-2 border-purple-400/40`}> 
          {job.compatibility}%
        </div>
      </header>
      <p className="text-gray-200 text-base leading-relaxed">
        {job.description 
          ? job.description.slice(0, 120) + (job.description.length > 120 ? '...' : '') 
          : 'No description available.'
        }
      </p>
    </article>
  );
} 