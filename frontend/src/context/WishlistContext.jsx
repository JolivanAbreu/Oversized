import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const data = await api.get('/wishlist');
      setItems(data);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isFavorite = useCallback((productId) => items.some((i) => i.productId === productId), [items]);

  const toggle = useCallback(async (productId) => {
    if (isFavorite(productId)) {
      await api.delete(`/wishlist/${productId}`);
    } else {
      await api.post('/wishlist', { product_id: productId });
    }
    await refresh();
  }, [isFavorite, refresh]);

  return (
    <WishlistContext.Provider value={{ items, loading, isFavorite, toggle, refresh }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist deve ser usado dentro de WishlistProvider');
  return ctx;
}
