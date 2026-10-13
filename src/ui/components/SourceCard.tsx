// PRESENTATION LAYER: where a recipe comes from, with a link to the original page.
// From the mockup's "External Source" variant, minus its "steps are on the original site" text and author line
// (every recipe has its steps in the app, and there is no author data).
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Recipe } from '../../domain/recipe';
import { formatSourceName, formatViewSourceLabel } from '../format/recipeInfo';
import { colors, fonts, fontSize, radii, shadows, spacing } from '../theme';
import { Icon } from './Icon';

type Props = {
  recipe: Pick<Recipe, 'sourceSite' | 'sourceUrl'>;
  /** Opens the original page; the screen decides how. */
  onOpen: () => void;
};

const CHIP_SIZE = 44;

export function SourceCard({ recipe, onOpen }: Props) {
  const linkLabel = formatViewSourceLabel(recipe);
  return (
    <View>
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.chip}>
            <Icon name="link" size={22} color={colors.amber} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.caption}>Recipe from</Text>
            <Text style={styles.site}>{formatSourceName(recipe)}</Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={linkLabel}
          onPress={onOpen}
          style={({ pressed }) => [styles.link, pressed && styles.linkPressed]}
        >
          <Text style={styles.linkText}>{linkLabel}</Text>
          <Icon name="externalLink" size={17} color={colors.accent} strokeWidth={2} />
        </Pressable>
      </View>
      <Text style={styles.note}>Opens in your browser.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  chip: {
    width: CHIP_SIZE,
    height: CHIP_SIZE,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.amberSoft,
  },
  headerText: { flexShrink: 1 },
  caption: { fontSize: fontSize.caption, fontFamily: fonts.bold, color: colors.textMuted },
  site: {
    fontFamily: fonts.heading,
    fontSize: fontSize.emphasis,
    color: colors.text,
  },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    minHeight: 48,
    marginTop: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.accent,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  linkPressed: { backgroundColor: colors.pressed },
  linkText: { fontSize: fontSize.input, fontFamily: fonts.heavy, color: colors.accent },
  note: {
    marginTop: 10,
    marginHorizontal: spacing.xs,
    fontFamily: fonts.regular,
    fontSize: fontSize.caption,
    lineHeight: 17,
    color: colors.textMuted,
  },
});
