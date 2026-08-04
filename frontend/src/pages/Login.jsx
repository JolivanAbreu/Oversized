import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Field, { inputClass } from '../components/Field';
import Button from '../components/Button';
import { ErrorNotice } from '../components/States';
import { ApiError } from '../api/client';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.redirectTo || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(form.email, form.password);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível entrar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16 sm:px-8">
      <h1 className="font-display text-5xl">Entrar</h1>
      <p className="mt-2 text-sm text-ink-soft">Acesse sua conta para finalizar a compra e ver seus pedidos.</p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <Field label="E-mail">
          <input
            type="email" required className={inputClass}
            value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="Senha">
          <input
            type="password" required className={inputClass}
            value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Field>

        <ErrorNotice message={error} />

        <Button type="submit" variant="tag" size="lg" className="w-full" disabled={loading}>
          {loading ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-ink-soft">
        Ainda não tem conta?{' '}
        <Link to="/criar-conta" state={{ redirectTo }} className="text-ink underline decoration-dotted hover:text-tag">
          Criar conta
        </Link>
      </p>
    </div>
  );
}
