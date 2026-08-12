// Extrai a área recortada de uma imagem usando <canvas> e devolve um Blob
// pronto pra enviar como arquivo — o corte é aplicado de verdade na
// imagem (não é só um "object-position" visual), então o arquivo que sobe
// pro servidor já sai na proporção certa e mais leve.

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.crossOrigin = 'anonymous';
    img.src = src;
  });
}

export async function getCroppedImageBlob(imageSrc, croppedAreaPixels, { fileName = 'imagem.jpg', mimeType = 'image/jpeg', quality = 0.92 } = {}) {
  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  canvas.width = croppedAreaPixels.width;
  canvas.height = croppedAreaPixels.height;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    image,
    croppedAreaPixels.x,
    croppedAreaPixels.y,
    croppedAreaPixels.width,
    croppedAreaPixels.height,
    0,
    0,
    croppedAreaPixels.width,
    croppedAreaPixels.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Não foi possível gerar a imagem recortada'));
        return;
      }
      resolve(new File([blob], fileName, { type: mimeType }));
    }, mimeType, quality);
  });
}
