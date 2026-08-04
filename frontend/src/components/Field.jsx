export default function Field({ label, error, children, hint }) {
  return (
    <label className="block">
      <span className="font-mono text-xs uppercase tracking-widest text-ink-soft">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && !error && <span className="mt-1 block text-xs text-ink-soft">{hint}</span>}
      {error && <span className="mt-1 block text-xs text-danger">{error}</span>}
    </label>
  );
}

export const inputClass =
  'w-full border-2 border-ink bg-white px-4 py-2.5 text-sm outline-none focus:border-tag';
