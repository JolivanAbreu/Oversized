import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import Field, { inputClass } from '../components/Field';
import Button from '../components/Button';
import { ErrorNotice, LoadingBlock } from '../components/States';
import { maskCEP, maskUF } from '../lib/masks';
import { useCepAutofill } from '../lib/useCepAutofill';

const empty = { street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zip: '' };

export default function Addresses() {
  const [addresses, setAddresses] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { handleCepChange, loadingCep, cepNotFound } = useCepAutofill(setForm);

  function load() {
    api.get('/addresses').then(setAddresses);
  }

  useEffect(load, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/addresses', form);
      setForm(empty);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar.');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(id) {
    await api.delete(`/addresses/${id}`);
    load();
  }

  if (addresses === null) return <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8"><LoadingBlock label="Carregando endereços" /></div>;

  return (
    <div className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <h1 className="font-display text-5xl">Endereços</h1>

      <div className="mt-8 space-y-3">
        {addresses.map((addr) => (
          <div key={addr.id} className="flex items-center justify-between border-2 border-ink p-4">
            <span className="font-mono text-sm">{addr.street}, {addr.number} — {addr.neighborhood}, {addr.city}/{addr.state} · {addr.zip}</span>
            <button onClick={() => handleRemove(addr.id)} className="font-mono text-xs uppercase text-ink-soft underline decoration-dotted hover:text-danger">
              remover
            </button>
          </div>
        ))}
      </div>

      {!showForm && (
        <Button variant="secondary" className="mt-6" onClick={() => setShowForm(true)}>+ Novo endereço</Button>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 border-2 border-ink p-5">
          <Field label="CEP" hint={loadingCep ? 'Buscando endereço...' : cepNotFound ? 'CEP não encontrado — preencha manualmente' : 'Digite o CEP para preencher o resto automaticamente'}>
            <input
              required
              className={inputClass}
              value={form.zip}
              onChange={(e) => handleCepChange(maskCEP(e.target.value))}
              placeholder="00000-000"
            />
          </Field>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Field label="Rua"><input required className={inputClass} value={form.street} onChange={(e) => setForm({ ...form, street: e.target.value })} /></Field>
            </div>
            <Field label="Número"><input required className={inputClass} value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} /></Field>
          </div>
          <Field label="Complemento (opcional)"><input className={inputClass} value={form.complement} onChange={(e) => setForm({ ...form, complement: e.target.value })} /></Field>
          <Field label="Bairro"><input required className={inputClass} value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} /></Field>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <Field label="Cidade"><input required className={inputClass} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} /></Field>
            </div>
            <Field label="UF"><input required maxLength={2} className={inputClass} value={form.state} onChange={(e) => setForm({ ...form, state: maskUF(e.target.value) })} /></Field>
          </div>
          <ErrorNotice message={error} />
          <div className="flex gap-3">
            <Button type="submit" variant="tag" disabled={loading}>Salvar</Button>
            <Button type="button" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </form>
      )}
    </div>
  );
}
