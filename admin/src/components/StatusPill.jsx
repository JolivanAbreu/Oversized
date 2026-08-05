const TONE_STYLES = {
  lime: 'text-lime bg-lime-bg',
  warn: 'text-warn bg-warn-bg',
  danger: 'text-danger bg-danger-bg',
  neutral: 'text-ink-soft bg-canvas',
};

export default function StatusPill({ label, tone = 'neutral' }) {
  return <span className={`status-pill ${TONE_STYLES[tone] || TONE_STYLES.neutral}`}>{label}</span>;
}
