import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import Field, { inputClass } from '../components/Field';
import Button from '../components/Button';
import StatusPill from '../components/StatusPill';
import { ErrorNotice, LoadingBlock } from '../components/States';
import { formatDate } from '../lib/format';

const emptyForm = { code: '', discountType: 'percentage', discountValue: '', minOrderValue: '', validFrom: '', validUntil: '', usageLimit: '' };

// yyyy-mm-dd para o input type="date"
function toDateInputValue(isoString) {
  return isoString ? isoString.slice(0, 10) : '';
}

export default function Coupons() {
  const [coupons, setCoupons] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);

  function load() {
    api.get('/admin/coupons').then(setCoupons);
  }
  useEffect(load, []);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function startEdit(coupon) {
    setEditingId(coupon.id);
    setForm({
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      minOrderValue: String(coupon.minOrderValue || 0),
      validFrom: toDateInputValue(coupon.validFrom),
      validUntil: toDateInputValue(coupon.validUntil),
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : '',
    });
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    const payload = {
      code: form.code,
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : 0,
      validFrom: new Date(form.validFrom).toISOString(),
      validUntil: new Date(form.validUntil).toISOString(),
      usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
    };
    try {
      if (editingId) {
        await api.put(`/admin/coupons/${editingId}`, payload);
      } else {
        await api.post('/admin/coupons', payload);
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar o cupom.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(coupon) {
    await api.put(`/admin/coupons/${coupon.id}/active`, { active: !coupon.active });
    load();
  }

  async function handleDelete(coupon) {
    await api.delete(`/admin/coupons/${coupon.id}`);
    setConfirmingDeleteId(null);
    load();
  }

  if (coupons === null) return <LoadingBlock label="Carregando cupons" />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cupons</h1>
        {!showForm && <Button onClick={startCreate}>+ Novo cupom</Button>}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 rounded-lg border border-line bg-white p-6 md:grid-cols-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft md:col-span-2">
            {editingId ? 'Editando cupom' : 'Novo cupom'}
          </p>
          <Field label="Código">
            <input required className={inputClass} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="BEMVINDA10" />
          </Field>
          <Field label="Tipo de desconto">
            <select className={inputClass} value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}>
              <option value="percentage">Percentual (%)</option>
              <option value="fixed">Valor fixo (R$)</option>
            </select>
          </Field>
          <Field label={form.discountType === 'percentage' ? 'Desconto (%)' : 'Desconto (R$)'}>
            <input required type="number" step="0.01" min="0" className={inputClass} value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} />
          </Field>
          <Field label="Valor mínimo do pedido (R$)">
            <input type="number" step="0.01" min="0" className={inputClass} value={form.minOrderValue} onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })} />
          </Field>
          <Field label="Válido a partir de">
            <input required type="date" className={inputClass} value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} />
          </Field>
          <Field label="Válido até">
            <input required type="date" className={inputClass} value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
          </Field>
          <Field label="Limite de usos (opcional)">
            <input type="number" min="1" className={inputClass} value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} placeholder="Sem limite" />
          </Field>

          <div className="md:col-span-2">
            <ErrorNotice message={error} />
          </div>
          <div className="flex gap-3 md:col-span-2">
            <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar cupom'}</Button>
            <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancelar</Button>
          </div>
        </form>
      )}

      <div className="mt-6 overflow-hidden rounded-lg border border-line bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
              <th className="px-4 py-3">Código</th>
              <th className="px-4 py-3">Desconto</th>
              <th className="px-4 py-3">Validade</th>
              <th className="px-4 py-3">Usos</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ações</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-line align-top last:border-0">
                <td className="px-4 py-3 font-mono font-medium">{c.code}</td>
                <td className="px-4 py-3">{c.discountType === 'percentage' ? `${c.discountValue}%` : `R$ ${c.discountValue}`}</td>
                <td className="px-4 py-3 text-ink-soft">{formatDate(c.validFrom)} – {formatDate(c.validUntil)}</td>
                <td className="px-4 py-3 text-ink-soft">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                <td className="px-4 py-3">
                  <StatusPill label={c.active ? 'Ativo' : 'Inativo'} tone={c.active ? 'lime' : 'neutral'} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => startEdit(c)} className="text-xs text-ink-soft underline decoration-dotted hover:text-tag">editar</button>
                    <button onClick={() => toggleActive(c)} className="text-xs text-ink-soft underline decoration-dotted hover:text-tag">
                      {c.active ? 'desativar' : 'ativar'}
                    </button>
                    {confirmingDeleteId === c.id ? (
                      <span className="flex items-center gap-2">
                        <span className="text-xs text-danger-bg">excluir de vez?</span>
                        <button onClick={() => handleDelete(c)} className="text-xs font-semibold text-tag">sim</button>
                        <button onClick={() => setConfirmingDeleteId(null)} className="text-xs text-ink-soft">não</button>
                      </span>
                    ) : (
                      <button onClick={() => setConfirmingDeleteId(c.id)} className="text-xs text-ink-soft underline decoration-dotted hover:text-tag">excluir</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
