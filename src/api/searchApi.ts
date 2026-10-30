import { AI_SEARCH_BASE_URL } from '@/constants/config';
import API, { aiSearchAPI } from '@/lib/axios-client';
import { uploadImageToS3 } from '@/lib/upload';
import type { AISearchResult, AssistantMessage } from '@/types';

export interface GeoOptions {
  lat?: number;
  lng?: number;
  radius_km?: number;
}

// ─── Mappers (ported from the web's ai-search.service) ───────────────────────

function mapBusiness(b: Record<string, unknown>, score = 0): AISearchResult {
  const address = b.address as { fullAddress?: string; city?: string } | undefined;
  return {
    id: b._id as string,
    type: 'business',
    name: (b.businessName as string) ?? 'Business',
    description: (b.about as string) ?? '',
    subtitle: (b.category as string) ?? '',
    image: (b.businessLogo as string) ?? null,
    price: null,
    rating: typeof b.averageRating === 'number' ? (b.averageRating as number) : null,
    location: address?.fullAddress ?? address?.city ?? null,
    inStock: null,
    score,
    raw: b,
  };
}

function mapProduct(p: Record<string, unknown>, score = 0): AISearchResult {
  const media = p.media as string[] | undefined;
  const business = p.business as { businessName?: string } | undefined;
  return {
    id: p._id as string,
    type: 'product',
    name: (p.name as string) ?? 'Product',
    description: (p.description as string) ?? '',
    subtitle: (p.category as string) ?? (business?.businessName ? `by ${business.businessName}` : ''),
    image: Array.isArray(media) ? media[0] ?? null : null,
    price: typeof p.price === 'number' ? (p.price as number) : null,
    rating: typeof p.averageRating === 'number' ? (p.averageRating as number) : null,
    location: null,
    inStock: typeof p.stock === 'number' ? (p.stock as number) > 0 : null,
    score,
    raw: p,
  };
}

/** Unwrap Atlas/ES-style hits ({ _source }, { document }, …). */
function unwrap(raw: Record<string, unknown>): Record<string, unknown> {
  const score = raw.score ?? raw._score ?? raw.similarity;
  for (const key of ['_source', 'source', 'document', 'hit', 'data', 'item']) {
    const inner = raw[key];
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
      const u = inner as Record<string, unknown>;
      if (score !== undefined && u.score === undefined) u._outerScore = score;
      return u;
    }
  }
  return raw;
}

/** Flatten the Lambda's { businesses, products } into one list — products first. */
export function flattenResults(results: Record<string, unknown>): AISearchResult[] {
  const flat: AISearchResult[] = [];
  const products = results['products'];
  const businesses = results['businesses'];
  if (Array.isArray(products)) {
    for (const prod of products as Record<string, unknown>[]) {
      const p = unwrap(prod);
      flat.push(mapProduct(p, (p.final_score as number) ?? (p._outerScore as number) ?? 0));
    }
  }
  if (Array.isArray(businesses)) {
    for (const biz of businesses as Record<string, unknown>[]) {
      const b = unwrap(biz);
      flat.push(mapBusiness(b, (b.final_score as number) ?? (b._outerScore as number) ?? 0));
    }
  }
  return flat;
}

// ─── 1) AI TEXT SEARCH (geo-aware Lambda, in-house fallback) ─────────────────

export async function textSearch(query: string, opts: GeoOptions = {}): Promise<AISearchResult[]> {
  if (!query.trim()) return [];
  if (!AI_SEARCH_BASE_URL) return productAndBusinessTextSearch(query, opts);
  try {
    const { data } = await aiSearchAPI.post('/search', {
      q: query,
      lat: opts.lat,
      lng: opts.lng,
      radius_km: opts.radius_km ?? 10,
      business_limit: 5,
      product_limit: 10,
    });
    const results = flattenResults((data?.results ?? {}) as Record<string, unknown>);
    // The Lambda can return 200 with no matches — fall back to the in-house search.
    return results.length ? results : productAndBusinessTextSearch(query, opts);
  } catch {
    return productAndBusinessTextSearch(query, opts);
  }
}

/** In-house text search fallback — GET {API}/search?q=&type=all. */
export async function productAndBusinessTextSearch(query: string, opts: GeoOptions = {}): Promise<AISearchResult[]> {
  const { data } = await API.get('/search', {
    params: { q: query, type: 'all', lat: opts.lat, lng: opts.lng },
  });
  const root = (data?.data ?? data ?? {}) as { businesses?: Record<string, unknown>[]; products?: Record<string, unknown>[] };
  const products = (root.products ?? []).map((p) => mapProduct(p));
  const businesses = (root.businesses ?? []).map((b) => mapBusiness(b));
  return [...products, ...businesses];
}

// ─── 2) VISUAL / IMAGE SEARCH (Atlas vector, in-house) ───────────────────────

export async function imageSearch(uri: string, _opts: GeoOptions = {}): Promise<AISearchResult[]> {
  const imageUrl = await uploadImageToS3(uri, 'search');
  const { data } = await API.post('/products/image-search', { imageUrl });
  const products = (data?.products ?? data?.data ?? []) as Record<string, unknown>[];
  return (Array.isArray(products) ? products : []).map((p) => mapProduct(p, typeof p.score === 'number' ? (p.score as number) : 0));
}

// ─── 3) AI ASSISTANT CHATBOT ─────────────────────────────────────────────────

export interface AssistantReply {
  reply: string;
  suggestions: AISearchResult[];
}

export async function assistantChat(messages: AssistantMessage[]): Promise<AssistantReply> {
  const { data } = await API.post('/assistant/chat', { messages });
  const reply = (data?.reply ?? data?.data?.reply ?? '') as string;
  const suggestions = Array.isArray(data?.products)
    ? (data.products as Record<string, unknown>[]).map((p) => mapProduct(p))
    : [];
  return { reply, suggestions };
}

export { mapBusiness, mapProduct, unwrap };
