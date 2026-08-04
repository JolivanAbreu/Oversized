export default function Tag({ children, variant, tilt = 'left', className = '' }) {
  const variantClass = variant === 'tag' ? 'tag--tag' : variant === 'lime' ? 'tag--lime' : '';
  const tiltClass = tilt === 'right' ? 'tag--tilt-right' : '';
  return (
    <span className={`tag ${variantClass} ${tiltClass} ${className}`}>
      {children}
    </span>
  );
}
