import { useCallback, useState } from 'react';
import * as Location from 'expo-location';

interface Coords {
  lat: number;
  lng: number;
}

interface UseLocation {
  coords: Coords | null;
  enabled: boolean;
  loading: boolean;
  denied: boolean;
  /** Toggle geo on/off; requests permission + position when turning on. */
  toggle: () => Promise<void>;
}

/**
 * Device geolocation via expo-location. Gracefully handles permission denial
 * (falls back to non-geo search — `coords` stays null, `denied` set true).
 */
export function useLocation(): UseLocation {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [denied, setDenied] = useState(false);

  const toggle = useCallback(async () => {
    if (enabled) {
      setEnabled(false);
      setCoords(null);
      return;
    }
    setLoading(true);
    setDenied(false);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setDenied(true);
        setEnabled(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      setEnabled(true);
    } catch {
      setDenied(true);
      setEnabled(false);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  return { coords, enabled, loading, denied, toggle };
}
