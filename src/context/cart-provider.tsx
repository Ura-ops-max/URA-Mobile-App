import { createContext, useContext, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addToCart, getCart, removeFromCart, updateQuantity } from '@/api/cart';
import { useAuthContext } from '@/context/auth-provider';
import type { Cart } from '@/types';

interface CartContextValue {
  cart: Cart;
  totalItems: number;
  isLoading: boolean;
  add: (productId: string, quantity?: number) => Promise<void>;
  updateQty: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  isMutating: boolean;
}

const EMPTY_CART: Cart = { items: [], subtotal: 0, totalItems: 0 };
const CartContext = createContext<CartContextValue | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthContext();
  const { data, isLoading } = useQuery({ queryKey: ['cart'], queryFn: getCart, enabled: isAuthenticated });

  const invalidate = (next?: Cart) => {
    if (next) queryClient.setQueryData(['cart'], next);
    else queryClient.invalidateQueries({ queryKey: ['cart'] });
  };

  const addMut = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      addToCart(productId, quantity),
    onSuccess: invalidate,
  });
  const updateMut = useMutation({
    mutationFn: ({ productId, quantity }: { productId: string; quantity: number }) =>
      updateQuantity(productId, quantity),
    onSuccess: invalidate,
  });
  const removeMut = useMutation({
    mutationFn: (productId: string) => removeFromCart(productId),
    onSuccess: invalidate,
  });

  const cart = data ?? EMPTY_CART;
  const value: CartContextValue = {
    cart,
    totalItems: cart.totalItems,
    isLoading,
    add: async (productId, quantity = 1) => {
      await addMut.mutateAsync({ productId, quantity });
    },
    updateQty: (productId, quantity) => updateMut.mutate({ productId, quantity }),
    remove: (productId) => removeMut.mutate(productId),
    isMutating: addMut.isPending || updateMut.isPending || removeMut.isPending,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCartContext() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCartContext must be used within CartProvider');
  return ctx;
}
