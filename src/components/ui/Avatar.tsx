import { View } from 'react-native';
import { Image } from 'expo-image';
import { BadgeCheck } from 'lucide-react-native';
import { fontFamily, useTheme, makeStyles } from '@/theme';
import { initials } from '@/lib/format';
import { Text } from './Text';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  verified?: boolean;
  rounded?: boolean;
}

export function Avatar({ uri, name, size = 44, verified, rounded = true }: AvatarProps) {
  const { colors } = useTheme();
  const styles = useStyles();
  const radius = rounded ? size / 2 : 10;
  return (
    <View style={{ width: size, height: size }}>
      {uri ? (
        <Image
          source={{ uri }}
          style={{ width: size, height: size, borderRadius: radius, backgroundColor: colors.surfaceAlt }}
          contentFit="cover"
          transition={150}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            { width: size, height: size, borderRadius: radius },
          ]}
        >
          <Text
            style={{
              color: colors.white,
              fontFamily: fontFamily.semibold,
              fontSize: size * 0.38,
            }}
          >
            {initials(name)}
          </Text>
        </View>
      )}
      {verified ? (
        <View style={styles.badge}>
          <BadgeCheck size={size * 0.34} color={colors.info} fill={colors.white} />
        </View>
      ) : null}
    </View>
  );
}

const useStyles = makeStyles((colors) => ({
  fallback: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    backgroundColor: colors.surface,
    borderRadius: 999,
  },
}));
