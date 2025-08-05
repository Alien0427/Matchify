export default function ProModal({ open, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay with blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" aria-hidden="true"></div>
      {/* Modal content */}
      <div className="relative bg-[#18181b] rounded-2xl shadow-2xl p-8 border border-[#2a2a2e] max-w-md w-full flex flex-col items-center z-10">
        <h2 className="text-2xl font-bold mb-4 text-textPrimary">Want to try the pro model?</h2>
        <p className="text-textSecondary mb-6 text-center">
          You've reached your free quota of 2 job views. Upgrade to Pro for unlimited access!
        </p>
        <div className="flex gap-4 mt-2">
          <a
            href="/pricing"
            className="bg-accent hover:bg-accentHover text-white font-semibold px-6 py-2 rounded-full shadow-neon transition-all duration-300"
            style={{ textDecoration: 'none' }}
          >
            Go Pro
          </a>
          <button
            className="bg-gray-700 hover:bg-gray-800 text-white font-semibold px-6 py-2 rounded-full transition-all duration-300"
            onClick={onClose}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
} 