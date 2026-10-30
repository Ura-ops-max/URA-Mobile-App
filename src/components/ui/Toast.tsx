import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CheckCircle2, Info, XCircle } from 'lucide-react-native';
import { radii, shadow, spacing, useTheme, makeStyles } from '@/theme';
import { Text } from './Text';

type ToastTone = 'success' | 'error' | 'info';
interface ToastState {
  id: number;
  message: string;
  tone: ToastTone;
}

interface ToastContextValue {
  show: (message: string, tone?: ToastTone) => void;
  success: (message: string) => void;
  error: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const styles = useStyles();
  const [toast, setToast] = useState<ToastState | null>(null);
  const insets = useSafeAreaInsets();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    if (timer.current) clearTimeout(timer.current);
    const id = Date.now();
    setToast({ id, message, tone });
    timer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const value: ToastContextValue = {
    show,
    success: (m) => show(m, 'success'),
    error: (m) => show(m, 'error'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          entering={FadeInUp}
          exiting={FadeOutUp}
          style={[styles.wrap, { top: insets.top + spacing.sm }]}
          pointerEvents="none"
        >
          <View style={styles.toast}>
            {toast.tone === 'success' ? (
              <CheckCircle2 size={20} color={colors.success} />
            ) : toast.tone === 'error' ? (
              <XCircle size={20} color={colors.danger} />
            ) : (
              <Info size={20} color={colors.info} />
            )}
            <Text style={styles.text} numberOfLines={2}>
              {toast.message}
            </Text>
          </View>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const useStyles = makeStyles((colors) => ({
  wrap: { position: 'absolute', left: spacing.lg, right: spacing.lg, zIndex: 1000 },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    ...shadow.floating,
  },
  text: { flex: 1, color: colors.text },
}));
