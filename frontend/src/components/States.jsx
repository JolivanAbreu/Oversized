export function LoadingBlock({ label = 'Carregando' }) {
  return (
    <div className="flex items-center gap-3 py-16 font-mono text-xs uppercase tracking-widest text-ink-soft">
      <span className="h-2 w-2 animate-ping rounded-full bg-tag" />
      {label}...
    </div>
  );
}

export function EmptyState({ title, description, action, icon }) {
  return (
    <div className="flex flex-col items-center gap-3.5 rounded-lg bg-white px-6 py-14 text-center shadow-[0_4px_15px_rgba(0,0,0,0.05)]">
      {icon && <span className="text-4xl text-[#cccccc]">{icon}</span>}
      <p className="text-base font-black uppercase text-[#111111]">{title}</p>
      {description && <p className="mx-auto max-w-sm text-xs text-ink-soft">{description}</p>}
      {action && <div className="mt-2 flex justify-center">{action}</div>}
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
