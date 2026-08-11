import { useState } from 'react';
import GarmentArt from './GarmentArt';

export default function ProductGallery({ product, color, className = '' }) {
  const images = product?.images || [];
  const [activeIndex, setActiveIndex] = useState(0);
  const [broken, setBroken] = useState({});

  const hasRealImages = images.length > 0;
  const active = images[activeIndex];

  return (
    <div>
      <div className={`relative overflow-hidden border-2 border-ink bg-canvas-alt ${className}`}>
        {hasRealImages && !broken[activeIndex] ? (
          <img
            src={active.url}
            alt={`${product.name} — foto ${activeIndex + 1}`}
            className="h-full w-full object-cover"
            onError={() => setBroken((prev) => ({ ...prev, [activeIndex]: true }))}
          />
        ) : (
          <GarmentArt color={color} className="h-full w-full" />
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex gap-2">
          {images.map((img, i) => (
            <button
              key={img.id || i}
              onClick={() => setActiveIndex(i)}
              className={`h-16 w-16 shrink-0 overflow-hidden border-2 ${activeIndex === i ? 'border-ink' : 'border-line opacity-70 hover:opacity-100'}`}
              aria-label={`Ver foto ${i + 1} de ${images.length}`}
            >
              {!broken[i] ? (
                <img
                  src={img.url}
                  alt=""
                  className="h-full w-full object-cover"
                  onError={() => setBroken((prev) => ({ ...prev, [i]: true }))}
                />
              ) : (
                <GarmentArt color={color} className="h-full w-full" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
