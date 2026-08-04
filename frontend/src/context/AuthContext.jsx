import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getAccessToken, setTokens, clearTokens } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Não há endpoint "/me" no backend; guardamos o usuário retornado no
    // login em localStorage para restaurar a sessão ao recarregar a página.
    const stored = localStorage.getItem('bos_user');
    if (stored && getAccessToken()) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.post('/login', { email, password }, { auth: false });
    setTokens(data);
    localStorage.setItem('bos_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async ({ name, email, password, cpf, phone }) => {
    await api.post('/register', { name, email, password, cpf, phone }, { auth: false });
    return login(email, password);
  }, [login]);

  const logout = useCallback(() => {
    clearTokens();
    localStorage.removeItem('bos_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
