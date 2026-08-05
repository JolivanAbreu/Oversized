import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';

export default function ConfirmEmail() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [status, setStatus] = useState('loading'); // loading | success | error

  useEffect(() => {
    if (!token) {
      setStatus('error');
      return;
    }
    api.post('/confirm-email', { token }, { auth: false })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="mx-auto max-w-md px-5 py-24 text-center sm:px-8">
      {status === 'loading' && <p className="font-mono text-sm text-ink-soft">Confirmando seu e-mail...</p>}
      {status === 'success' && (
        <>
          <p className="font-display text-4xl">E-mail confirmado!</p>
          <Link to="/entrar" className="mt-6 inline-block font-mono text-xs uppercase underline decoration-dotted hover:text-tag">
            Ir para o login →
          </Link>
        </>
      )}
      {status === 'error' && (
        <>
          <p className="font-display text-4xl">Link inválido ou expirado</p>
          <p className="mt-2 text-sm text-ink-soft">Faça login normalmente — se ainda precisar confirmar, entre em contato com o suporte.</p>
        </>
      )}
    </div>
  );
}
