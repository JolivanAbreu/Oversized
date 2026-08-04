const PALETTE = {
  Preto: '#17161C',
  Branco: '#F4F2EA',
  Cinza: '#8B8878',
  Bege: '#D8CBB0',
  Azul: '#2B4468',
  Verde: '#3E5C3A',
  Vinho: '#5C2430',
};

function colorFor(name) {
  return PALETTE[name] || '#3A3945';
}

export default function GarmentArt({ color = 'Preto', className = '' }) {
  const fill = colorFor(color);
  return (
    <svg viewBox="0 0 400 460" className={className} role="img" aria-label={`Ilustração de blusa oversized na cor ${color}`}>
      <rect width="400" height="460" fill="var(--color-canvas-alt)" />
      {/* silhueta oversized: ombros caídos, mangas largas, corpo longo e solto */}
      <path
        d="M 130 70
           L 160 40 L 240 40 L 270 70
           L 340 110 L 320 190 L 275 165
           L 285 400 L 115 400 L 125 165
           L 80 190 L 60 110 Z"
        fill={fill}
        opacity="0.92"
      />
      <path d="M 160 40 Q 200 75 240 40" fill="none" stroke="var(--color-canvas-alt)" strokeWidth="6" />
      <line x1="200" y1="40" x2="200" y2="400" stroke="black" strokeOpacity="0.06" strokeWidth="1" />
    </svg>
  );
}
