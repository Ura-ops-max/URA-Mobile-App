// Terms / Privacy layout: hero, "On this page" shortcuts that scroll to each
// section, numbered section cards, and a contact card at the end.
import { useRef } from 'react';
import { Pressable, ScrollView, View, type ScrollViewInstance } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Text } from '@/components/ui';
import { radii, spacing, useTheme, makeStyles } from '@/theme';
import { InfoCard, InfoHero, Para, SupportCta } from './InfoKit';

export interface LegalSection {
  heading: string;
  body: string;
}

export function LegalPage({
  icon,
  eyebrow,
  title,
  updated,
  intro,
  sections,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
}) {
  const { colors } = useTheme();
  const styles = useStyles();
  const scroll = useRef<ScrollViewInstance>(null);
  const offsets = useRef<Record<number, number>>({});
  const bodyTop = useRef(0);

  return (
    <ScrollView ref={scroll} style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scroll}>
      <InfoHero icon={icon} eyebrow={eyebrow} title={title} intro={intro} meta={`Last updated ${updated}`} />

      <View style={styles.toc}>
        <Text variant="label" muted>
          ON THIS PAGE
        </Text>
        <View style={styles.chips}>
          {sections.map((s, i) => (
            <Pressable
              key={s.heading}
              onPress={() => scroll.current?.scrollTo({ y: bodyTop.current + (offsets.current[i] ?? 0) - 12, animated: true })}
              style={({ pressed }) => [styles.chip, pressed && { borderColor: colors.primary }]}
            >
              <Text variant="small" weight="semibold">
                {i + 1}. {s.heading}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.body} onLayout={(e) => (bodyTop.current = e.nativeEvent.layout.y)}>
        {sections.map((s, i) => (
          <View key={s.heading} onLayout={(e) => (offsets.current[i] = e.nativeEvent.layout.y)}>
            <InfoCard index={i + 1} title={s.heading}>
              <Para>{s.body}</Para>
            </InfoCard>
          </View>
        ))}
        <SupportCta title="Questions about this document?" text="Email info@ura.com.ng and we'll explain anything that isn't clear." />
      </View>
    </ScrollView>
  );
}

const useStyles = makeStyles((colors) => ({
  scroll: { paddingBottom: spacing.xxxl },
  toc: {
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  body: { padding: spacing.lg, gap: spacing.md },
}));
