export default function Button({ as: Component = 'button', variant = 'primary', size = 'md', className = '', children, ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-mono uppercase tracking-wide transition-transform active:translate-y-0.5 disabled:opacity-40 disabled:pointer-events-none';
  const sizes = {
    sm: 'px-4 py-2 text-xs',
    md: 'px-6 py-3 text-sm',
    lg: 'px-8 py-4 text-base',
  };
  const variants = {
    primary: 'bg-ink text-white border-2 border-ink hover:bg-tag hover:text-ink hover:border-tag',
    secondary: 'bg-transparent text-ink border-2 border-ink hover:bg-ink hover:text-white',
    tag: 'bg-tag text-ink border-2 border-ink shadow-[3px_3px_0_var(--color-ink)] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px]',
    ghost: 'bg-transparent text-ink border-2 border-transparent hover:border-ink',
  };

  return (
    <Component className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>
      {children}
    </Component>
  );
}
