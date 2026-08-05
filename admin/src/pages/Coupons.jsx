import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import Field, { inputClass } from '../components/Field';
import Button from '../components/Button';
import StatusPill from '../components/StatusPill';
import { ErrorNotice, LoadingBlock } from '../components/States';
import { formatDate } from '../lib/format';

const emptyForm = { code: '', discountType: 'percentage', discountValue: '', minOrderValue: '', validFrom: '', validUntil: '', usageLimit: '' };

export default function Coupons() {
  const [coupons, setCoupons] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  function load() {
    api.get('/admin/coupons').then(setCoupons);
  }
  useEffect(load, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.post('/admin/coupons', {
        code: form.code,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderValue: form.minOrderValue ? Number(form.minOrderValue) : 0,
        validFrom: new Date(form.validFrom).toISOString(),
        validUntil: new Date(form.validUntil).toISOString(),
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
      });
      setForm(emptyForm);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível criar o cupom.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(coupon) {
    await api.put(`/admin/coupons/${coupon.id}/active`, { active: !coupon.active });
    load();
  }

  if (coupons === null) return <LoadingBlock label="Carregando cupons" />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Cupons</h1>
        {!showForm && <Button onClick={() => setShowForm(true)}>+ Novo cupom</Button>}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 rounded-lg border border-line bg-white p-6 md:grid-cols-2">
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
            <Button type="submit" disabled={saving}>{saving ? 'Criando...' : 'Criar cupom'}</Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
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
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0">
                <td className="px-4 py-3 font-mono font-medium">{c.code}</td>
                <td className="px-4 py-3">{c.discountType === 'percentage' ? `${c.discountValue}%` : `R$ ${c.discountValue}`}</td>
                <td className="px-4 py-3 text-ink-soft">{formatDate(c.validFrom)} – {formatDate(c.validUntil)}</td>
                <td className="px-4 py-3 text-ink-soft">{c.usedCount}{c.usageLimit ? ` / ${c.usageLimit}` : ''}</td>
                <td className="px-4 py-3">
                  <StatusPill label={c.active ? 'Ativo' : 'Inativo'} tone={c.active ? 'lime' : 'neutral'} />
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => toggleActive(c)} className="text-xs text-ink-soft underline decoration-dotted hover:text-tag">
                    {c.active ? 'desativar' : 'ativar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
