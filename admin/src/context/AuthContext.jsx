import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getAccessToken, setTokens, clearTokens, ApiError } from '../api/client';

const AuthContext = createContext(null);
const STORAGE_KEY = 'bos_admin_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && getAccessToken()) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await api.post('/login', { email, password }, { auth: false });

    if (!['admin', 'operator'].includes(data.user.role)) {
      throw new ApiError(403, 'forbidden', 'Esta conta não tem acesso ao painel administrativo.');
    }

    setTokens(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    clearTokens();
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAuthenticated: !!user, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
