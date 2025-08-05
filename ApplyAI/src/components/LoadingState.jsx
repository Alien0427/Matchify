export default function LoadingState() {
  return (
    <div role="status" aria-live="polite" className="flex items-center justify-center space-x-2">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
      <span className="text-sm text-gray-600">Processing your resume...</span>
    </div>
  );
} 