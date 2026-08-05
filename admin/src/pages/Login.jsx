import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Field, { inputClass } from '../components/Field';
import Button from '../components/Button';
import { ErrorNotice } from '../components/States';
import { ApiError } from '../api/client';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-5">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 shadow-xl">
        <p className="font-display text-2xl">BLUSÃO</p>
        <p className="text-xs uppercase tracking-widest text-ink-soft">Painel administrativo</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <Field label="E-mail">
            <input type="email" required autoFocus className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </Field>
          <Field label="Senha">
            <input type="password" required className={inputClass} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </Field>
          <ErrorNotice message={error} />
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Entrando...' : 'Entrar'}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-ink-soft">
          Acesso restrito à equipe da loja. Problemas de acesso? Fale com um administrador.
        </p>
      </div>
    </div>
  );
}
