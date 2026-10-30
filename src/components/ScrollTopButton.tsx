import { useCallback, useRef, useState } from 'react';
import { FlatList, Pressable, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { ArrowUp } from 'lucide-react-native';
import { shadow, useTheme, makeStyles } from '@/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * Tracks scroll offset and exposes a floating "scroll to top" button.
 * Wire `ref` + `onScroll` onto a FlatList and render `button` inside the screen.
 */
export function useScrollToTop<T>(threshold = 500) {
  const ref = useRef<FlatList<T>>(null);
  const [visible, setVisible] = useState(false);

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const past = e.nativeEvent.contentOffset.y > threshold;
      setVisible((prev) => (prev === past ? prev : past));
    },
    [threshold],
  );

  const scrollToTop = useCallback(() => {
    ref.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const button = visible ? <ScrollTopButton onPress={scrollToTop} /> : null;

  return { ref, onScroll, visible, scrollToTop, button };
}

export function ScrollTopButton({ onPress, bottom = 84 }: { onPress: () => void; bottom?: number }) {
  const { colors } = useTheme();
  const styles = useStyles();
  return (
    <AnimatedPressable entering={FadeIn.duration(150)} exiting={FadeOut.duration(150)} style={[styles.btn, { bottom }]} onPress={onPress} hitSlop={8}>
      <ArrowUp size={22} color={colors.white} />
    </AnimatedPressable>
  );
}

const useStyles = makeStyles((colors) => ({
  btn: {
    position: 'absolute',
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.floating,
  },
}));
