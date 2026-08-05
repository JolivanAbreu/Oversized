import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import Field, { inputClass } from '../components/Field';
import Button from '../components/Button';
import { ErrorNotice, LoadingBlock } from '../components/States';

const SIZES = ['P', 'M', 'G', 'GG', 'XG'];
let tempIdCounter = 0;
const nextTempId = () => `temp-${++tempIdCounter}`;
const isTemp = (tempId) => String(tempId).startsWith('temp-');

const emptyVariant = () => ({ tempId: nextTempId(), size: 'M', color: '', sku: '', stockQuantity: 0, priceOverride: '' });
const emptyImage = () => ({ tempId: nextTempId(), url: '' });

function StockAdjuster({ variant, onAdjusted }) {
  const [open, setOpen] = useState(false);
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function apply() {
    if (!delta || !reason) {
      setError('Informe a quantidade e o motivo.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const updated = await api.put(`/admin/variants/${variant.id}/stock`, { delta: Number(delta), reason });
      onAdjusted(updated.stockQuantity);
      setOpen(false);
      setDelta('');
      setReason('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível ajustar.');
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs text-ink-soft underline decoration-dotted hover:text-tag">
        Ajustar estoque
      </button>
    );
  }

  return (
    <div className="col-span-12 mt-2 flex flex-wrap items-end gap-2 rounded-md bg-canvas p-3">
      <Field label="Ajuste (+/-)">
        <input type="number" className={`${inputClass} w-28`} value={delta} onChange={(e) => setDelta(e.target.value)} placeholder="ex.: -3" />
      </Field>
      <Field label="Motivo">
        <input className={`${inputClass} w-56`} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="ex.: avaria, inventário" />
      </Field>
      <Button type="button" size="sm" onClick={apply} disabled={busy}>{busy ? 'Aplicando...' : 'Aplicar'}</Button>
      <Button type="button" variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancelar</Button>
      {error && <span className="w-full text-xs text-danger">{error}</span>}
    </div>
  );
}

export default function ProductForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();

  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    categoryId: '', name: '', slug: '', description: '', fabric: '', careInstructions: '', basePrice: '', active: true,
  });
  const [variants, setVariants] = useState([emptyVariant()]);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/categories', { auth: false }).then(setCategories);
  }, []);

  useEffect(() => {
    if (!isEditing) return;
    api.get(`/admin/products/${id}`).then((data) => {
      setForm({
        categoryId: data.categoryId,
        name: data.name,
        slug: data.slug,
        description: data.description || '',
        fabric: data.fabric || '',
        careInstructions: data.careInstructions || '',
        basePrice: data.basePrice,
        active: data.active,
      });
      setVariants(data.variants.length ? data.variants.map((v) => ({ ...v, tempId: v.id })) : [emptyVariant()]);
      setImages(data.images.map((img) => ({ ...img, tempId: img.id })));
      setLoading(false);
    });
  }, [id, isEditing]);

  function slugify(text) {
    return text.toLowerCase().trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  function updateVariant(tempId, patch) {
    setVariants((prev) => prev.map((v) => (v.tempId === tempId ? { ...v, ...patch } : v)));
  }
  function removeVariant(tempId) {
    setVariants((prev) => prev.filter((v) => v.tempId !== tempId));
  }
  function updateImage(tempId, patch) {
    setImages((prev) => prev.map((img) => (img.tempId === tempId ? { ...img, ...patch } : img)));
  }
  function removeImage(tempId) {
    setImages((prev) => prev.filter((img) => img.tempId !== tempId));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.categoryId) {
      setError('Selecione uma categoria.');
      return;
    }
    if (variants.length === 0) {
      setError('Cadastre ao menos uma variação (tamanho/cor).');
      return;
    }
    for (const v of variants) {
      if (!v.color || !v.sku) {
        setError('Toda variação precisa de cor e SKU preenchidos.');
        return;
      }
    }

    const payload = {
      ...form,
      basePrice: Number(form.basePrice),
      variants: variants.map((v) => ({
        ...(isTemp(v.tempId) ? {} : { id: v.id }),
        size: v.size,
        color: v.color,
        sku: v.sku,
        stockQuantity: Number(v.stockQuantity),
        priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
      })),
      images: images.filter((img) => img.url).map((img, idx) => ({ url: img.url, order: idx })),
    };

    setSaving(true);
    try {
      if (isEditing) {
        await api.put(`/admin/products/${id}`, payload);
      } else {
        await api.post('/admin/products', payload);
      }
      navigate('/produtos');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar o produto.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingBlock label="Carregando produto" />;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">{isEditing ? 'Editar produto' : 'Novo produto'}</h1>

      <form onSubmit={handleSubmit} className="mt-6 space-y-8">
        <section className="rounded-lg border border-line bg-white p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Dados básicos</h2>
          <div className="mt-4 space-y-4">
            <Field label="Nome">
              <input
                required className={inputClass} value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({ ...f, name, slug: isEditing ? f.slug : slugify(name) }));
                }}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Slug (URL)" hint="Gerado automaticamente, mas pode editar">
                <input required className={inputClass} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
              </Field>
              <Field label="Categoria">
                <select required className={inputClass} value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                  <option value="">Selecione...</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Descrição">
              <textarea rows={3} className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Tecido">
                <input className={inputClass} value={form.fabric} onChange={(e) => setForm({ ...form, fabric: e.target.value })} />
              </Field>
              <Field label="Preço base (R$)">
                <input required type="number" step="0.01" min="0" className={inputClass} value={form.basePrice} onChange={(e) => setForm({ ...form, basePrice: e.target.value })} />
              </Field>
            </div>
            <Field label="Instruções de cuidado">
              <textarea rows={2} className={inputClass} value={form.careInstructions} onChange={(e) => setForm({ ...form, careInstructions: e.target.value })} />
            </Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
              Visível na loja (ativo)
            </label>
          </div>
        </section>

        <section className="rounded-lg border border-line bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Variações (tamanho + cor)</h2>
            <Button type="button" variant="secondary" size="sm" onClick={() => setVariants((prev) => [...prev, emptyVariant()])}>
              + Adicionar variação
            </Button>
          </div>

          <div className="mt-4 space-y-3">
            {variants.map((v) => (
              <div key={v.tempId} className="grid grid-cols-12 gap-2 rounded-md border border-line p-3">
                <select className={`${inputClass} col-span-2`} value={v.size} onChange={(e) => updateVariant(v.tempId, { size: e.target.value })}>
                  {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
                <input className={`${inputClass} col-span-2`} placeholder="Cor" value={v.color} onChange={(e) => updateVariant(v.tempId, { color: e.target.value })} />
                <input className={`${inputClass} col-span-3`} placeholder="SKU" value={v.sku} onChange={(e) => updateVariant(v.tempId, { sku: e.target.value })} />
                <input type="number" min="0" className={`${inputClass} col-span-2`} placeholder="Estoque" value={v.stockQuantity} onChange={(e) => updateVariant(v.tempId, { stockQuantity: e.target.value })} />
                <input type="number" step="0.01" min="0" className={`${inputClass} col-span-2`} placeholder="Preço específico" value={v.priceOverride || ''} onChange={(e) => updateVariant(v.tempId, { priceOverride: e.target.value })} />
                <button type="button" onClick={() => removeVariant(v.tempId)} className="col-span-1 text-xs text-ink-soft hover:text-danger">
                  remover
                </button>
                {!isTemp(v.tempId) && (
                  <div className="col-span-12">
                    <StockAdjuster variant={v} onAdjusted={(newQty) => updateVariant(v.tempId, { stockQuantity: newQty })} />
                  </div>
                )}
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-ink-soft">
            Removendo uma variação por aqui apenas a tira desta lista — se ela já tiver pedidos associados, prefira zerar o estoque em vez de excluir.
          </p>
        </section>

        <section className="rounded-lg border border-line bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-soft">Imagens</h2>
            <Button type="button" variant="secondary" size="sm" onClick={() => setImages((prev) => [...prev, emptyImage()])}>
              + Adicionar imagem
            </Button>
          </div>
          <div className="mt-4 space-y-2">
            {images.map((img) => (
              <div key={img.tempId} className="flex gap-2">
                <input className={inputClass} placeholder="https://..." value={img.url} onChange={(e) => updateImage(img.tempId, { url: e.target.value })} />
                <button type="button" onClick={() => removeImage(img.tempId)} className="text-xs text-ink-soft hover:text-danger">remover</button>
              </div>
            ))}
            {images.length === 0 && <p className="text-xs text-ink-soft">Nenhuma imagem cadastrada — a loja usa uma ilustração padrão nesse caso.</p>}
          </div>
        </section>

        <ErrorNotice message={error} />

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : 'Salvar produto'}</Button>
          <Button type="button" variant="ghost" onClick={() => navigate('/produtos')}>Cancelar</Button>
        </div>
      </form>
    </div>
  );
}
