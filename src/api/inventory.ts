import API from '@/lib/axios-client';

export interface InventoryProduct {
  _id: string;
  name: string;
  sku?: string;
  barcode?: string;
  unit?: string;
  price: number;
  stock: number;
  category?: string;
  media: string[];
  isHidden: boolean;
  description?: string;
  updatedAt?: string;
}

/** GET /products/inventory → { success, products } — the owner's own products, hidden ones included. */
export async function getInventory(): Promise<InventoryProduct[]> {
  const { data } = await API.get('/products/inventory');
  return (Array.isArray(data?.products) ? data.products : []).map((p: Record<string, any>) => ({
    _id: String(p._id),
    name: String(p.name ?? ''),
    sku: p.sku ?? undefined,
    barcode: p.barcode ?? undefined,
    unit: p.unit ?? undefined,
    price: Number(p.price) || 0,
    stock: Number(p.stock) || 0,
    category: p.category ?? undefined,
    media: Array.isArray(p.media) ? p.media : [],
    isHidden: !!p.isHidden,
    description: p.description ?? undefined,
    updatedAt: p.updatedAt,
  }));
}

export interface StockEdit {
  id: string;
  stock?: number;
  price?: number;
  isHidden?: boolean;
}

/** PATCH /products/stock { items } (up to 200) → { updated, skipped }. */
export async function updateStock(items: StockEdit[]): Promise<{ updated: number; skipped?: number }> {
  const { data } = await API.patch('/products/stock', { items });
  return { updated: Number(data?.updated) || 0, skipped: data?.skipped };
}
