import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const emptyCart = { id: null, items: [], subtotal: 0, discount: 0 };

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [cart, setCart] = useState(emptyCart);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setCart(emptyCart);
      return;
    }
    setLoading(true);
    try {
      const data = await api.get('/cart');
      setCart(data);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addItem = useCallback(async (variantId, quantity = 1) => {
    await api.post('/cart/items', { variant_id: variantId, quantity });
    await refresh();
  }, [refresh]);

  const updateItem = useCallback(async (itemId, quantity) => {
    await api.put(`/cart/items/${itemId}`, { quantity });
    await refresh();
  }, [refresh]);

  const removeItem = useCallback(async (itemId) => {
    await api.delete(`/cart/items/${itemId}`);
    await refresh();
  }, [refresh]);

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ cart, loading, itemCount, refresh, addItem, updateItem, removeItem }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart deve ser usado dentro de CartProvider');
  return ctx;
}
