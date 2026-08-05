export function LoadingBlock({ label = 'Carregando' }) {
  return (
    <div className="flex items-center gap-3 py-16 text-sm text-ink-soft">
      <span className="h-2 w-2 animate-ping rounded-full bg-tag" />
      {label}...
    </div>
  );
}

export function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-lg border border-dashed border-line bg-white px-6 py-16 text-center">
      <p className="text-lg font-semibold">{title}</p>
      {description && <p className="mx-auto mt-2 max-w-sm text-sm text-ink-soft">{description}</p>}
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}

export function ErrorNotice({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-md border border-danger bg-danger-bg px-4 py-3 text-sm text-danger">
      {message}
    </div>
  );
}

export function SuccessNotice({ message }) {
  if (!message) return null;
  return (
    <div className="rounded-md border border-lime bg-lime-bg px-4 py-3 text-sm text-lime">
      {message}
    </div>
  );
}
