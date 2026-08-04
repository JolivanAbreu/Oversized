export function LoadingBlock({ label = 'Carregando' }) {
  return (
    <div className="flex items-center gap-3 py-16 font-mono text-xs uppercase tracking-widest text-ink-soft">
      <span className="h-2 w-2 animate-ping rounded-full bg-tag" />
      {label}...
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="border-2 border-dashed border-line px-6 py-16 text-center">
      <p className="font-display text-2xl">{title}</p>
      {description && <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">{description}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorNotice({ message }) {
  if (!message) return null;
  return (
    <div className="border-2 border-danger bg-danger/10 px-4 py-3 font-mono text-xs text-danger">
      {message}
    </div>
  );
}
