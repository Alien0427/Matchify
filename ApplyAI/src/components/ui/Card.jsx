export function Card({ children, className = "", ...props }) {
  return (
    <div 
      className={`bg-surface/50 border border-accent/10 rounded-xl p-6 backdrop-blur-sm transition-all duration-300 ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}