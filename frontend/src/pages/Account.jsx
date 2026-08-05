import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import { useAuth } from '../context/AuthContext';
import Field, { inputClass } from '../components/Field';
import Button from '../components/Button';
import { ErrorNotice, LoadingBlock } from '../components/States';
import { maskCPF, maskPhone } from '../lib/masks';

export default function Account() {
  const { setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [profileError, setProfileError] = useState('');
  const [profileSaved, setProfileSaved] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSaved, setPasswordSaved] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const [emailForm, setEmailForm] = useState({ newEmail: '', currentPassword: '' });
  const [emailError, setEmailError] = useState('');
  const [emailSaved, setEmailSaved] = useState(false);
  const [savingEmail, setSavingEmail] = useState(false);

  useEffect(() => {
    api.get('/account').then((data) => {
      setProfile(data);
      setForm({ name: data.name, phone: maskPhone(data.phone || '') });
    });
  }, []);

  async function handleSaveProfile(e) {
    e.preventDefault();
    setProfileError('');
    setProfileSaved(false);
    setSavingProfile(true);
    try {
      const updated = await api.put('/account', form);
      setProfile(updated);
      setUser({ name: updated.name });
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (err) {
      setProfileError(err instanceof ApiError ? err.message : 'Não foi possível salvar.');
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangeEmail(e) {
    e.preventDefault();
    setEmailError('');
    setEmailSaved(false);

    if (!emailForm.newEmail || !emailForm.currentPassword) {
      setEmailError('Preencha o novo e-mail e sua senha atual.');
      return;
    }

    setSavingEmail(true);
    try {
      const updated = await api.put('/account/email', {
        new_email: emailForm.newEmail,
        current_password: emailForm.currentPassword,
      });
      setProfile(updated);
      setUser({ email: updated.email });
      setEmailForm({ newEmail: '', currentPassword: '' });
      setEmailSaved(true);
      setTimeout(() => setEmailSaved(false), 2500);
    } catch (err) {
      setEmailError(err instanceof ApiError ? err.message : 'Não foi possível trocar o e-mail.');
    } finally {
      setSavingEmail(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordError('');
    setPasswordSaved(false);

    if (passwordForm.newPassword.length < 8) {
      setPasswordError('A nova senha deve ter ao menos 8 caracteres.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('A confirmação não coincide com a nova senha.');
      return;
    }

    setSavingPassword(true);
    try {
      await api.put('/account/password', {
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPasswordSaved(true);
      setTimeout(() => setPasswordSaved(false), 2500);
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : 'Não foi possível trocar a senha.');
    } finally {
      setSavingPassword(false);
    }
  }

  if (!profile) return <div className="mx-auto max-w-2xl px-5 py-16 sm:px-8"><LoadingBlock label="Carregando conta" /></div>;

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 sm:px-8">
      <h1 className="font-display text-5xl">Minha conta</h1>

      <section className="mt-10 border-2 border-ink p-6">
        <h2 className="font-display text-2xl">Dados pessoais</h2>
        <form onSubmit={handleSaveProfile} className="mt-4 space-y-4">
          <Field label="Nome completo">
            <input required className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Telefone">
            <input inputMode="numeric" placeholder="(00) 00000-0000" className={inputClass} value={form.phone} onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })} />
          </Field>
          <Field label="E-mail" hint="Use a seção abaixo para trocar seu e-mail.">
            <input disabled className={`${inputClass} cursor-not-allowed opacity-60`} value={profile.email} readOnly />
          </Field>
          <Field label="CPF" hint="Documento fixo, não pode ser alterado.">
            <input disabled className={`${inputClass} cursor-not-allowed opacity-60`} value={maskCPF(profile.cpf || '')} readOnly />
          </Field>
          <ErrorNotice message={profileError} />
          {profileSaved && <p className="font-mono text-xs text-tag">Dados atualizados ✓</p>}
          <Button type="submit" variant="tag" disabled={savingProfile}>
            {savingProfile ? 'Salvando...' : 'Salvar alterações'}
          </Button>
        </form>
      </section>

      <section className="mt-8 border-2 border-ink p-6">
        <h2 className="font-display text-2xl">Trocar e-mail</h2>
        <p className="mt-1 text-sm text-ink-soft">E-mail atual: {profile.email}</p>
        <form onSubmit={handleChangeEmail} className="mt-4 space-y-4">
          <Field label="Novo e-mail">
            <input type="email" required className={inputClass} value={emailForm.newEmail} onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })} />
          </Field>
          <Field label="Senha atual" hint="Confirme sua senha para trocar o e-mail">
            <input type="password" required className={inputClass} value={emailForm.currentPassword} onChange={(e) => setEmailForm({ ...emailForm, currentPassword: e.target.value })} />
          </Field>
          <ErrorNotice message={emailError} />
          {emailSaved && <p className="font-mono text-xs text-tag">E-mail atualizado ✓</p>}
          <Button type="submit" variant="secondary" disabled={savingEmail}>
            {savingEmail ? 'Salvando...' : 'Trocar e-mail'}
          </Button>
        </form>
      </section>

      <section className="mt-8 border-2 border-ink p-6">
        <h2 className="font-display text-2xl">Trocar senha</h2>
        <form onSubmit={handleChangePassword} className="mt-4 space-y-4">
          <Field label="Senha atual">
            <input type="password" required className={inputClass} value={passwordForm.currentPassword} onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })} />
          </Field>
          <Field label="Nova senha" hint="Mínimo de 8 caracteres">
            <input type="password" required className={inputClass} value={passwordForm.newPassword} onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })} />
          </Field>
          <Field label="Confirmar nova senha">
            <input type="password" required className={inputClass} value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })} />
          </Field>
          <ErrorNotice message={passwordError} />
          {passwordSaved && <p className="font-mono text-xs text-tag">Senha atualizada ✓</p>}
          <Button type="submit" variant="secondary" disabled={savingPassword}>
            {savingPassword ? 'Salvando...' : 'Trocar senha'}
          </Button>
        </form>
      </section>
    </div>
  );
}
