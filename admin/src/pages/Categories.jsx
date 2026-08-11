import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import Field, { inputClass } from '../components/Field';
import Button from '../components/Button';
import { ErrorNotice, LoadingBlock, EmptyState } from '../components/States';

const emptyForm = { name: '', description: '' };

export default function Categories() {
  const [categories, setCategories] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [confirmingDeleteId, setConfirmingDeleteId] = useState(null);

  function load() {
    api.get('/admin/categories').then(setCategories);
  }
  useEffect(load, []);

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError('');
  }

  function startEdit(category) {
    setEditingId(category.id);
    setForm({ name: category.name, description: category.description || '' });
    setShowForm(true);
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (editingId) {
        await api.put(`/admin/categories/${editingId}`, form);
      } else {
        await api.post('/admin/categories', form);
      }
      setForm(emptyForm);
      setEditingId(null);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível salvar a categoria.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(category) {
    setDeleteError('');
    try {
      await api.delete(`/admin/categories/${category.id}`);
      setConfirmingDeleteId(null);
      load();
    } catch (err) {
      setDeleteError(err instanceof ApiError ? err.message : 'Não foi possível excluir a categoria.');
      setConfirmingDeleteId(null);
    }
  }

  if (categories === null) return <LoadingBlock label="Carregando categorias" />;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Categorias</h1>
        {!showForm && <Button onClick={startCreate}>+ Nova categoria</Button>}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-lg border border-line bg-white p-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">
            {editingId ? 'Editando categoria' : 'Nova categoria'}
          </p>
          <Field label="Nome">
            <input required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex.: Moletons" />
          </Field>
          <Field label="Descrição (opcional)">
            <textarea rows={2} className={inputClass} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </Field>
          <ErrorNotice message={error} />
          <div className="flex gap-3">
            <Button type="submit" disabled={saving}>{saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar categoria'}</Button>
            <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancelar</Button>
          </div>
        </form>
      )}

      <div className="mt-4"><ErrorNotice message={deleteError} /></div>

      <div className="mt-6 overflow-hidden rounded-lg border border-line bg-white">
        {categories.length === 0 ? (
          <div className="p-6"><EmptyState title="Nenhuma categoria cadastrada" /></div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs uppercase tracking-wide text-ink-soft">
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">Slug</th>
                <th className="px-4 py-3">Produtos</th>
                <th className="px-4 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b border-line align-top last:border-0">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-ink-soft">{c.slug}</td>
                  <td className="px-4 py-3 text-ink-soft">{c.productCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => startEdit(c)} className="text-xs text-ink-soft underline decoration-dotted hover:text-tag">editar</button>
                      {confirmingDeleteId === c.id ? (
                        <span className="flex items-center gap-2">
                          <span className="text-xs text-ink-soft">excluir?</span>
                          <button onClick={() => handleDelete(c)} className="text-xs font-semibold text-tag">sim</button>
                          <button onClick={() => setConfirmingDeleteId(null)} className="text-xs text-ink-soft">não</button>
                        </span>
                      ) : (
                        <button onClick={() => setConfirmingDeleteId(c.id)} className="text-xs text-ink-soft underline decoration-dotted hover:text-tag">excluir</button>
                      )}
                    </div>
                    {c.productCount > 0 && (
                      <p className="mt-1 text-xs text-ink-soft">tem produtos — não pode excluir</p>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
