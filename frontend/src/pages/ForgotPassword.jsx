import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import Field, { inputClass } from '../components/Field';
import Button from '../components/Button';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/forgot-password', { email }, { auth: false });
    } finally {
      // Sempre mostramos a mesma mensagem, exista ou não o e-mail — evita que
      // alguém descubra quais e-mails estão cadastrados na loja.
      setSent(true);
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 py-16 sm:px-8">
      <h1 className="font-display text-5xl">Esqueci a senha</h1>

      {sent ? (
        <div className="mt-8 border-2 border-ink bg-lime p-4 font-mono text-sm">
          Se esse e-mail estiver cadastrado, você vai receber um link para redefinir a senha em instantes.
        </div>
      ) : (
        <>
          <p className="mt-2 text-sm text-ink-soft">Informe seu e-mail e enviaremos um link para redefinir sua senha.</p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <Field label="E-mail">
              <input type="email" required className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
            </Field>
            <Button type="submit" variant="tag" size="lg" className="w-full" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar link de redefinição'}
            </Button>
          </form>
        </>
      )}

      <p className="mt-6 text-sm text-ink-soft">
        <Link to="/entrar" className="text-ink underline decoration-dotted hover:text-tag">← Voltar para o login</Link>
      </p>
    </div>
  );
}
