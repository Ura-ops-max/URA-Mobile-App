import { useEffect } from 'react';
import { useColorScheme, View } from 'react-native';
import { Image } from 'expo-image';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { makeStyles, paletteFor } from '@/theme';

const LOGO = require('@/assets/images/ura-mark.png');

/** Branded splash/loading screen shown while fonts + session load. */
export function Preloader() {
  const styles = useStyles();
  const scale = useSharedValue(0.92);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
    opacity.value = withRepeat(withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [scale, opacity]);

  const animated = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));

  // Shown before the theme provider mounts, so follow the phone's setting directly.
  const background = paletteFor(useColorScheme() === 'dark' ? 'dark' : 'light').background;

  return (
    <View style={[styles.wrap, { backgroundColor: background }]}>
      <Animated.View style={animated}>
        <Image source={LOGO} style={styles.logo} contentFit="contain" />
      </Animated.View>
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  wrap: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 140, height: 140 },
}));
