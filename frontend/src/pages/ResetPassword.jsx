import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import Field, { inputClass } from '../components/Field';
import Button from '../components/Button';
import { ErrorNotice } from '../components/States';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('A senha deve ter ao menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/reset-password', { token, password }, { auth: false });
      setDone(true);
      setTimeout(() => navigate('/entrar'), 2000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Não foi possível redefinir a senha.');
    } finally {
      setLoading(false);
    }
  }

  if (!token) {
    return (
      <div className="mx-auto max-w-md px-5 py-16 sm:px-8">
        <h1 className="font-display text-4xl">Link inválido</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Esse link de redefinição está incompleto. Solicite um novo em{' '}
          <Link to="/esqueci-a-senha" className="underline decoration-dotted hover:text-tag">Esqueci a senha</Link>.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16 sm:px-8">
      <h1 className="font-display text-5xl">Nova senha</h1>

      {done ? (
        <div className="mt-8 border-2 border-ink bg-lime p-4 font-mono text-sm">
          Senha redefinida com sucesso! Levando você para o login...
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <Field label="Nova senha" hint="Mínimo de 8 caracteres">
            <input type="password" required className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
          </Field>
          <Field label="Confirmar nova senha">
            <input type="password" required className={inputClass} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </Field>
          <ErrorNotice message={error} />
          <Button type="submit" variant="tag" size="lg" className="w-full" disabled={loading}>
            {loading ? 'Salvando...' : 'Redefinir senha'}
          </Button>
        </form>
      )}
    </div>
  );
}
