/**
 * URA mobile design system: light and dark colours, spacing, radii, type.
 * Components read colours with `useTheme()` and theme-aware styles with
 * `makeStyles()`, so switching Light / Dark / System updates the whole app.
 */

import { createContext, useContext, useMemo } from 'react';
import { StyleSheet } from 'react-native';

/** Light theme — the web app's Tailwind palette. */
export const lightColors = {
  primary: '#FF6B35',
  primaryDark: '#E85A20',
  primarySoft: '#FFF0EA',
  accent: '#F59E0B',
  background: '#FAFAFB',
  surface: '#FFFFFF',
  surfaceAlt: '#F4F4F6',
  border: '#ECECEF',
  text: '#111114',
  muted: '#6B7280',
  mutedLight: '#9CA3AF',
  success: '#10B981',
  successSoft: '#ECFDF5',
  danger: '#EF4444',
  dangerSoft: '#FEF2F2',
  warning: '#F59E0B',
  warningSoft: '#FFFBEB',
  /** Dark text on warningSoft. */
  warningText: '#92400E',
  info: '#3B82F6',
  infoSoft: '#EFF6FF',
  /** Text/icons on top of `primary` and other solid colour fills. */
  white: '#FFFFFF',
  black: '#000000',
  star: '#FBBF24',
  /** Dimmed layer behind sheets and dialogs. */
  overlay: 'rgba(0,0,0,0.4)',
  /** Soft tint used for decorative glows. */
  glow: '#FFF7F2',
};

export type Colors = { [K in keyof typeof lightColors]: string };

/** Dark theme — near-black surfaces, softer borders, brighter brand orange. */
export const darkColors: Colors = {
  primary: '#FF7A45',
  primaryDark: '#FF9466',
  primarySoft: '#33201A',
  accent: '#FBBF24',
  background: '#0B0B0F',
  surface: '#16161C',
  surfaceAlt: '#202029',
  border: '#2A2A34',
  text: '#F4F4F6',
  muted: '#A1A1AA',
  mutedLight: '#71717A',
  success: '#34D399',
  successSoft: '#0F2A21',
  danger: '#F87171',
  dangerSoft: '#3A1818',
  warning: '#FBBF24',
  warningSoft: '#33290F',
  warningText: '#FCD34D',
  info: '#60A5FA',
  infoSoft: '#132339',
  white: '#FFFFFF',
  black: '#000000',
  star: '#FBBF24',
  overlay: 'rgba(0,0,0,0.6)',
  glow: '#1E1612',
};

export type ColorScheme = 'light' | 'dark';
export type ThemePreference = 'system' | ColorScheme;

let activeScheme: ColorScheme = 'light';

/** Set by ThemeProvider before its children render. */
export function setActiveScheme(scheme: ColorScheme) {
  activeScheme = scheme;
}

export const paletteFor = (scheme: ColorScheme): Colors => (scheme === 'dark' ? darkColors : lightColors);

/**
 * The current theme's colours, for code outside components (helpers called
 * during render). Inside components use `useTheme().colors` so they re-render
 * when the theme changes.
 */
export const colors = {} as Colors;
for (const key of Object.keys(lightColors) as (keyof Colors)[]) {
  Object.defineProperty(colors, key, { enumerable: true, get: () => paletteFor(activeScheme)[key] });
}

export interface ThemeContextValue {
  scheme: ColorScheme;
  colors: Colors;
  preference: ThemePreference;
  setPreference: (p: ThemePreference) => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  scheme: 'light',
  colors: lightColors,
  preference: 'system',
  setPreference: () => {},
});

/** Current colours and the Light / Dark / System choice. */
export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

/**
 * Styles that depend on the theme. Use like StyleSheet.create:
 *   const useStyles = makeStyles((colors) => ({ card: { backgroundColor: colors.surface } }));
 *   function Card() { const styles = useStyles(); ... }
 */
type StyleSheetInput = Parameters<typeof StyleSheet.create>[0];

export function makeStyles<S extends StyleSheetInput>(factory: (colors: Colors) => S & StyleSheetInput) {
  const cache = new Map<ColorScheme, Readonly<S>>();
  return function useStyles(): Readonly<S> {
    const { scheme } = useTheme();
    return useMemo(() => {
      const hit = cache.get(scheme);
      if (hit) return hit;
      const styles = StyleSheet.create(factory(paletteFor(scheme)));
      cache.set(scheme, styles);
      return styles;
    }, [scheme]);
  };
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radii = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 28,
  pill: 999,
} as const;

export const fontFamily = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
} as const;

/**
 * One compact, mobile-native type scale — used everywhere via Text variants.
 * tiny 11 · caption 12 · label 13 · body 14 · title 15/16 · h2 18 · h1 20 · display 24
 */
export const fontSize = {
  xs: 11,
  sm: 13,
  base: 14,
  md: 15,
  lg: 16,
  xl: 18,
  xxl: 20,
  xxxl: 24,
} as const;

/** Cap OS font scaling so "large text" accessibility can't blow up layouts. */
export const MAX_FONT_SCALE = 1.2;

export const shadow = {
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  floating: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

export const theme = {
  lightColors,
  darkColors,
  spacing,
  radii,
  fontFamily,
  fontSize,
  shadow,
} as const;

export type Theme = typeof theme;
export default theme;
