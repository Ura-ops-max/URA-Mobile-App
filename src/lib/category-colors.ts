/**
 * Ported from the web app's `lib/category-colors.ts`. Same NAMED map + hashing so
 * a category always maps to the same swatch. Tailwind classes are re-expressed as
 * native hex triples (bg / text / dot / softBorder).
 */

export interface CategoryColor {
  bg: string;
  text: string;
  dot: string;
  softBorder: string;
}

const PALETTE: CategoryColor[] = [
  { bg: '#FFF1F2', text: '#E11D48', dot: '#F43F5E', softBorder: '#FFE4E6' }, // rose
  { bg: '#EFF6FF', text: '#2563EB', dot: '#3B82F6', softBorder: '#DBEAFE' }, // blue
  { bg: '#F5F3FF', text: '#7C3AED', dot: '#8B5CF6', softBorder: '#EDE9FE' }, // violet
  { bg: '#ECFDF5', text: '#059669', dot: '#10B981', softBorder: '#D1FAE5' }, // emerald
  { bg: '#FFFBEB', text: '#D97706', dot: '#F59E0B', softBorder: '#FEF3C7' }, // amber
  { bg: '#ECFEFF', text: '#0891B2', dot: '#06B6D4', softBorder: '#CFFAFE' }, // cyan
  { bg: '#FDF4FF', text: '#C026D3', dot: '#D946EF', softBorder: '#FAE8FF' }, // fuchsia
  { bg: '#EEF2FF', text: '#4F46E5', dot: '#6366F1', softBorder: '#E0E7FF' }, // indigo
  { bg: '#F0FDFA', text: '#0D9488', dot: '#14B8A6', softBorder: '#CCFBF1' }, // teal
  { bg: '#FFF7ED', text: '#EA580C', dot: '#F97316', softBorder: '#FFEDD5' }, // orange
];

const NAMED: Record<string, number> = {
  fashion: 0, clothing: 0, wear: 0, apparel: 0,
  gadgets: 1, electronics: 1, phones: 1, tech: 1, computing: 1,
  beauty: 2, 'beauty & care': 2, cosmetics: 2, skincare: 2, 'health & beauty': 2,
  home: 8, 'home & living': 8, furniture: 8, kitchen: 8,
  groceries: 3, food: 3, farm: 3, foodstuff: 3, drinks: 3,
  jewelry: 6, jewellery: 6, accessories: 6, watches: 6,
  sports: 5, fitness: 5, outdoor: 5,
  books: 7, stationery: 7, education: 7,
  services: 4, general: 9, other: 9,
};

export function categoryColor(category?: string): CategoryColor {
  const key = (category || '').trim().toLowerCase();
  if (!key) return PALETTE[9];
  if (key in NAMED) return PALETTE[NAMED[key]];
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
