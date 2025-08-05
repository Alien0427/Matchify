export function Progress({ className = "" }) {
  return (
    <div
      className={`relative w-full h-2 bg-white/10 overflow-hidden rounded ${className}`}
    >
      <div className="absolute inset-0 animate-progress bg-accent" />
    </div>
  );
}
