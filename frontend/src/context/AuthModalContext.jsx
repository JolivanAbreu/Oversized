import { createContext, useCallback, useContext, useState } from 'react';

const AuthModalContext = createContext(null);

export function AuthModalProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [redirectTo, setRedirectTo] = useState(null);

  const openLoginModal = useCallback((redirect = null) => {
    setRedirectTo(redirect);
    setIsOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => setIsOpen(false), []);

  return (
    <AuthModalContext.Provider value={{ isOpen, redirectTo, openLoginModal, closeLoginModal }}>
      {children}
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error('useAuthModal deve ser usado dentro de AuthModalProvider');
  return ctx;
}
