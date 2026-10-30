import API from '@/lib/axios-client';
import type { Cart, CartItem } from '@/types';

/**
 * GET /cart and every cart write return the cart document itself (no `data`
 * wrapper): { items: [{ product: { _id, name, price, media, stock, business }, quantity }],
 * totalItems, totalPrice }. `product` is null when the product was deleted.
 */
function mapCart(raw: unknown): Cart {
  const c = (raw ?? {}) as { items?: unknown[] };
  const items: CartItem[] = (Array.isArray(c.items) ? c.items : [])
    .map((row) => {
      const r = row as { product?: Record<string, unknown> | string | null; quantity?: number };
      const p = r.product && typeof r.product === 'object' ? r.product : null;
      if (!p) return null;
      const business = p.business as string | { _id?: string; businessName?: string } | undefined;
      return {
        productId: String(p._id),
        name: String(p.name ?? ''),
        price: Number(p.price) || 0,
        quantity: Number(r.quantity) || 1,
        image: Array.isArray(p.media) && typeof p.media[0] === 'string' ? (p.media[0] as string) : '',
        stock: Number(p.stock) || 0,
        business: typeof business === 'object' && business ? String(business._id ?? '') : String(business ?? ''),
        businessName: typeof business === 'object' && business ? String(business.businessName ?? '') : '',
      };
    })
    .filter((i): i is CartItem => i !== null);
  return {
    items,
    subtotal: items.reduce((s, i) => s + i.price * i.quantity, 0),
    totalItems: items.reduce((s, i) => s + i.quantity, 0),
  };
}

export async function getCart(): Promise<Cart> {
  const { data } = await API.get('/cart');
  return mapCart(data);
}

export async function addToCart(productId: string, quantity = 1): Promise<Cart> {
  const { data } = await API.post('/cart/items', { productId, quantity });
  return mapCart(data);
}

export async function updateQuantity(productId: string, quantity: number): Promise<Cart> {
  const { data } = await API.patch('/cart/items', { productId, quantity });
  return mapCart(data);
}

export async function removeFromCart(productId: string): Promise<Cart> {
  const { data } = await API.delete(`/cart/items/${productId}`);
  return mapCart(data);
}
