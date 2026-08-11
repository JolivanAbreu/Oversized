export function StarDisplay({ value = 0, size = 'sm' }) {
  const sizeClass = size === 'lg' ? 'text-xl' : size === 'md' ? 'text-base' : 'text-sm';
  const rounded = Math.round(value);
  return (
    <span className={`inline-flex ${sizeClass} leading-none`} aria-label={`${value} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= rounded ? 'text-tag' : 'text-line'}>★</span>
      ))}
    </span>
  );
}

export function StarInput({ value, onChange }) {
  return (
    <div className="flex gap-1 text-2xl">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`transition-colors ${n <= value ? 'text-tag' : 'text-line hover:text-ink-soft'}`}
          aria-label={`Dar nota ${n}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}
