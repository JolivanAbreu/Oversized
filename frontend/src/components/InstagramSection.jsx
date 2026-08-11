import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';

/**
 * Vitrine "como no Instagram" — em vez de simular posts/curtidas falsos,
 * usa fotos reais do catálogo (as mais recentes), cada uma linkando pro
 * produto de verdade. O link "seguir" aponta pro perfil real da loja.
 */
export default function InstagramSection() {
  const [photos, setPhotos] = useState([]);

  useEffect(() => {
    api.get('/products?sort=newest', { auth: false })
      .then((data) => {
        const withPhotos = (data.data || [])
          .filter((p) => p.images?.[0]?.url)
          .slice(0, 6)
          .map((p) => ({ slug: p.slug, name: p.name, url: p.images[0].url }));
        setPhotos(withPhotos);
      })
      .catch(() => setPhotos([]));
  }, []);

  if (photos.length === 0) return null;

  return (
    <section className="mx-auto mb-8 max-w-7xl rounded-lg border border-line bg-canvas-alt p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#f09433] via-[#dc2743] to-[#bc1888] text-xl text-white">
            ig
          </div>
          <div>
            <h3 className="text-sm font-black uppercase">@dravennx_oficial</h3>
            <p className="text-xs text-ink-soft">Siga a gente e marque #DRAVENNX pra aparecer na vitrine</p>
          </div>
        </div>
        <a
          href="https://instagram.com/dravennx_oficial"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-ink px-5 py-2.5 text-[11px] font-black uppercase tracking-wide text-white transition-transform hover:-translate-y-0.5"
        >
          Seguir no Instagram
        </a>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2.5 sm:grid-cols-6">
        {photos.map((photo) => (
          <Link key={photo.slug} to={`/produtos/${photo.slug}`} className="group relative block aspect-square overflow-hidden rounded-md bg-canvas">
            <img src={photo.url} alt={photo.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-108" />
            <div className="absolute inset-0 flex items-end bg-black/0 p-2 opacity-0 transition-all duration-200 group-hover:bg-black/40 group-hover:opacity-100">
              <span className="text-[10px] font-bold uppercase text-white">{photo.name}</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
