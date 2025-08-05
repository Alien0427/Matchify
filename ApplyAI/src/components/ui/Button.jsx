import Link from 'next/link';

export function Button({ children, ariaLabel, variant = 'solid', size = 'md', href, className, ...props }) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background';
  
  const variants = {
    solid: 'bg-accent text-textPrimary hover:bg-accentHover shadow-neon hover:shadow-neon-hover',
    outline: 'bg-transparent border-2 border-accent/30 text-textSecondary hover:text-accent hover:border-accent hover:bg-accent/5',
    ghost: 'bg-surface/50 text-textSecondary hover:text-accent hover:bg-surface/80',
  };
  
  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3',
    lg: 'px-8 py-4 text-lg',
  };
  
  const cls = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={cls} {...props}>
        {children}
      </Link>
    );
  }
  return (
    <button
      aria-label={ariaLabel}
      className={cls}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;