export default function Button({ as: Component = 'button', variant = 'primary', size = 'md', className = '', children, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors disabled:opacity-40 disabled:pointer-events-none';
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };
  const variants = {
    primary: 'bg-ink text-white hover:bg-tag',
    secondary: 'bg-white text-ink border border-line hover:border-ink',
    danger: 'bg-danger-bg text-white hover:opacity-90',
    ghost: 'bg-transparent text-ink-soft hover:text-ink',
  };

  return (
    <Component className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </Component>
  );
}
