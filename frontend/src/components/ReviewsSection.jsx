import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { StarDisplay, StarInput } from './StarRating';
import Button from './Button';
import { ErrorNotice } from './States';
import { formatDate } from '../lib/format';

export default function ReviewsSection({ productId, avgRating, reviewCount }) {
  const { isAuthenticated } = useAuth();
  const [reviews, setReviews] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api.get(`/products/${productId}/reviews`, { auth: false }).then(setReviews);
  }, [productId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!rating) {
      setError('Escolha uma nota de 1 a 5 estrelas.');
      return;
    }
    setSaving(true);
    try {
      await api.post(`/products/${productId}/reviews`, { rating, comment });
      setDone(true);
      setShowForm(false);
      api.get(`/products/${productId}/reviews`, { auth: false }).then(setReviews);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'purchase_not_delivered') {
        setError('Você poderá avaliar assim que receber este produto.');
      } else if (err instanceof ApiError && err.status === 409) {
        setError('Você já avaliou este produto.');
      } else {
        setError(err instanceof ApiError ? err.message : 'Não foi possível enviar sua avaliação.');
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-16 border-t-2 border-ink pt-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-3xl">Avaliações</h2>
          {reviewCount > 0 ? (
            <div className="mt-2 flex items-center gap-2">
              <StarDisplay value={avgRating} size="md" />
              <span className="font-mono text-sm text-ink-soft">{avgRating} · {reviewCount} avaliaç{reviewCount === 1 ? 'ão' : 'ões'}</span>
            </div>
          ) : (
            <p className="mt-2 font-mono text-sm text-ink-soft">Ainda sem avaliações — seja a primeira pessoa a avaliar.</p>
          )}
        </div>

        {isAuthenticated && !showForm && !done && (
          <Button variant="secondary" onClick={() => setShowForm(true)}>Avaliar este produto</Button>
        )}
      </div>

      {done && (
        <div className="mt-6 border-2 border-ink bg-lime p-4 font-mono text-xs uppercase tracking-widest">
          Avaliação enviada — obrigado!
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 border-2 border-ink p-5">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">Sua nota</p>
            <div className="mt-2">
              <StarInput value={rating} onChange={setRating} />
            </div>
          </div>
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-ink-soft">Comentário (opcional)</p>
            <textarea
              rows={3}
              className="mt-2 w-full border-2 border-ink bg-white px-4 py-2.5 text-sm text-ink outline-none focus:border-tag"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Como foi o caimento, o tecido, o tamanho..."
            />
          </div>
          <ErrorNotice message={error} />
          <div className="flex gap-3">
            <Button type="submit" variant="tag" disabled={saving}>{saving ? 'Enviando...' : 'Enviar avaliação'}</Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </form>
      )}
      {!showForm && error && <div className="mt-4"><ErrorNotice message={error} /></div>}

      <div className="mt-8 divide-y-2 divide-line">
        {reviews === null && <p className="py-6 font-mono text-sm text-ink-soft">Carregando avaliações...</p>}
        {reviews?.length === 0 && <p className="py-6 font-mono text-sm text-ink-soft">Nenhuma avaliação ainda.</p>}
        {reviews?.map((r) => (
          <div key={r.id} className="py-5">
            <div className="flex items-center justify-between">
              <span className="font-medium">{r.user?.name || 'Cliente'}</span>
              <span className="font-mono text-xs text-ink-soft">{formatDate(r.createdAt)}</span>
            </div>
            <div className="mt-1"><StarDisplay value={r.rating} /></div>
            {r.comment && <p className="mt-2 text-sm text-ink-soft">{r.comment}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
