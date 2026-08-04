import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import ProductCard from '../components/ProductCard';
import Tag from '../components/Tag';
import Button from '../components/Button';
import { LoadingBlock } from '../components/States';

export default function Home() {
  const [products, setProducts] = useState(null);

  useEffect(() => {
    api.get('/products?sort=newest', { auth: false })
      .then((data) => setProducts(data.data))
      .catch(() => setProducts([]));
  }, []);

  return (
    <div>
      {/* Hero: a tipografia "estoura" a moldura da tela — o próprio título é
          oversized, ecoando o produto que a loja vende. */}
      <section className="relative overflow-hidden border-b-2 border-ink bg-canvas">
        <div className="mx-auto max-w-7xl px-5 pb-16 pt-14 sm:px-8 sm:pt-20">
          <Tag variant="lime">coleção atual · unissex</Tag>
          <h1 className="font-display mt-4 text-[18vw] leading-[0.82] tracking-tight sm:text-[11rem] md:text-[13rem]">
            TAMANHO<br />QUE SOBRA
          </h1>
          <div className="mt-6 flex flex-col items-start gap-6 sm:flex-row sm:items-end sm:justify-between">
            <p className="max-w-md text-base text-ink-soft sm:text-lg">
              Blusas e moletons de caimento largo, pensados pra quem curte roupa
              folgada de verdade — não o "oversized" que ainda aperta.
            </p>
            <Button as={Link} to="/produtos" variant="tag" size="lg">
              Ver loja completa →
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <div className="mb-8 flex items-end justify-between">
          <h2 className="font-display text-4xl">Novidades</h2>
          <Link to="/produtos" className="font-mono text-xs uppercase tracking-widest underline decoration-dotted hover:text-tag">
            ver tudo
          </Link>
        </div>

        {products === null && <LoadingBlock label="Carregando peças" />}
        {products && products.length === 0 && (
          <p className="font-mono text-sm text-ink-soft">Nenhum produto publicado ainda.</p>
        )}
        {products && products.length > 0 && (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <section className="border-y-2 border-ink bg-ink text-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-14 sm:grid-cols-3 sm:px-8">
          {[
            ['01', 'Pix na hora', 'QR Code gerado no checkout, confirmação automática.'],
            ['02', 'Cartão em até 6x', 'Parcelamento direto no cartão de crédito.'],
            ['03', 'Troca em 30 dias', 'Não serviu? Troca fácil, sem burocracia.'],
          ].map(([n, title, desc]) => (
            <div key={n}>
              <span className="font-mono text-xs text-tag">{n}</span>
              <p className="font-display mt-2 text-2xl">{title}</p>
              <p className="mt-1 text-sm text-white/60">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
