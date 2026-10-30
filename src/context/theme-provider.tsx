import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SystemUI from 'expo-system-ui';
import {
  paletteFor,
  setActiveScheme,
  ThemeContext,
  type ColorScheme,
  type ThemeContextValue,
  type ThemePreference,
} from '@/theme';

const KEY = 'ura_theme_preference';

/** Loads the saved Light / Dark / System choice (call before first render). */
export async function loadThemePreference(): Promise<ThemePreference> {
  try {
    const v = await AsyncStorage.getItem(KEY);
    return v === 'light' || v === 'dark' || v === 'system' ? v : 'system';
  } catch {
    return 'system';
  }
}

export function ThemeProvider({ initialPreference, children }: { initialPreference: ThemePreference; children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(initialPreference);
  const system = useColorScheme();
  const scheme: ColorScheme = preference === 'system' ? (system === 'dark' ? 'dark' : 'light') : preference;

  // Live colours for non-hook code, set before children render.
  setActiveScheme(scheme);

  // Native pieces (keyboard, alerts, date pickers) follow the choice; the root
  // window background avoids white flashes between screens in dark mode.
  useEffect(() => {
    // Not available on react-native-web (the browser preview).
    if (typeof Appearance.setColorScheme === 'function') {
      Appearance.setColorScheme(preference === 'system' ? 'unspecified' : preference);
    }
  }, [preference]);
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(paletteFor(scheme).background).catch(() => {});
  }, [scheme]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      scheme,
      colors: paletteFor(scheme),
      preference,
      setPreference: (p) => {
        setPreferenceState(p);
        AsyncStorage.setItem(KEY, p).catch(() => {});
      },
    }),
    [scheme, preference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
