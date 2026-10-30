import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Play } from 'lucide-react-native';
import { radii, useTheme } from '@/theme';

const VIDEO_RE = /\.(mp4|mov|m4v|webm|avi|mkv)(\?|$)/i;

export function isVideoUri(uri: string, type?: 'image' | 'video'): boolean {
  if (type) return type === 'video';
  return VIDEO_RE.test(uri);
}

interface MediaCarouselProps {
  media: string[];
  mediaTypes?: ('image' | 'video')[];
  width: number;
  height: number;
  radius?: number;
  onPress?: () => void;
}

export function MediaCarousel({ media, mediaTypes, width, height, radius = radii.md, onPress }: MediaCarouselProps) {
  const { colors } = useTheme();
  const [active, setActive] = useState(0);
  if (media.length === 0) return null;

  return (
    <View>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => setActive(Math.round(e.nativeEvent.contentOffset.x / width))}
      >
        {media.map((uri, i) => {
          const isVideo = isVideoUri(uri, mediaTypes?.[i]);
          return isVideo ? (
            <VideoSlide key={i} uri={uri} width={width} height={height} radius={radius} />
          ) : (
            <Pressable key={i} onPress={onPress}>
              <Image
                source={{ uri }}
                style={{ width, height, borderRadius: radius, backgroundColor: colors.surfaceAlt }}
                contentFit="cover"
                transition={150}
              />
            </Pressable>
          );
        })}
      </ScrollView>
      {media.length > 1 ? (
        <View style={styles.dots}>
          {media.map((_, i) => (
            <View key={i} style={[styles.dot, { backgroundColor: i === active ? colors.primary : colors.border }]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function VideoSlide({ uri, width, height, radius }: { uri: string; width: number; height: number; radius: number }) {
  const { colors } = useTheme();
  const [started, setStarted] = useState(false);
  const player = useVideoPlayer(uri, (p) => {
    p.loop = true;
    p.muted = true;
  });

  return (
    <View style={{ width, height, borderRadius: radius, overflow: 'hidden', backgroundColor: colors.black }}>
      <VideoView player={player} style={{ width, height }} contentFit="cover" nativeControls={started} />
      {!started ? (
        <Pressable
          style={styles.playOverlay}
          onPress={() => {
            setStarted(true);
            player.play();
          }}
        >
          <View style={styles.playBtn}>
            <Play size={26} color={colors.white} fill={colors.white} />
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginTop: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  playOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.15)' },
  playBtn: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', justifyContent: 'center' },
});
