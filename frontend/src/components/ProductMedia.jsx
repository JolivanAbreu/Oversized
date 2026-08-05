import { useState } from 'react';
import GarmentArt from './GarmentArt';

/**
 * Mostra a primeira imagem real do produto (cadastrada pelo admin) quando
 * existir; cai para a ilustração SVG quando o produto ainda não tem foto
 * cadastrada, ou se a URL cadastrada estiver quebrada.
 */
export default function ProductMedia({ product, color, className = '' }) {
  const imageUrl = product?.images?.[0]?.url;
  const [broken, setBroken] = useState(false);

  if (imageUrl && !broken) {
    return (
      <img
        src={imageUrl}
        alt={product.name}
        className={`object-cover ${className}`}
        onError={() => setBroken(true)}
      />
    );
  }

  return <GarmentArt color={color} className={className} />;
}
