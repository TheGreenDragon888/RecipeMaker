// PRESENTATION LAYER: where a recipe comes from, with a link to the original page.
// From the mockup's "External Source" variant, minus its "steps are on the original site" text and author line
// (every recipe has its steps in the app, and there is no author data).
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Recipe } from '../../domain/recipe';
import { formatSourceName, formatViewSourceLabel } from '../format/recipeInfo';
import { colors, fontSize, fontWeight, fonts, radii, shadows, spacing } from '../theme';

type Props = {
  recipe: Pick<Recipe, 'sourceSite' | 'sourceUrl'>;
  /** Opens the original page; the screen decides how. */
  onOpen: () => void;
};

export function SourceCard({ recipe, onOpen }: Props) {
  const linkLabel = formatViewSourceLabel(recipe);
  return (
    <View>
      <View style={styles.card}>
        <Text style={styles.caption}>Recipe from</Text>
        <Text style={styles.site}>{formatSourceName(recipe)}</Text>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={linkLabel}
          onPress={onOpen}
          style={({ pressed }) => [styles.link, pressed && styles.linkPressed]}
        >
          <Text style={styles.linkText}>{linkLabel}</Text>
          {/* A stand-in for the mockup's "open externally" icon until icons are approved. */}
          <Text style={styles.linkText}>↗</Text>
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
  caption: { fontSize: fontSize.caption, fontWeight: fontWeight.bold, color: colors.textMuted },
  site: {
    marginTop: spacing.xxs,
    fontFamily: fonts.heading,
    fontSize: fontSize.emphasis,
    fontWeight: fontWeight.semibold,
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
  linkText: { fontSize: fontSize.input, fontWeight: fontWeight.heavy, color: colors.accent },
  note: { marginTop: 10, marginHorizontal: spacing.xs, fontSize: fontSize.caption, color: colors.textMuted },
});
