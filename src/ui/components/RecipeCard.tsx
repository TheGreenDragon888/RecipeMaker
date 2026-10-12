// PRESENTATION LAYER: one recipe in a list (Results, Similar recipes). Tapping it opens the recipe.
// The mockup's photo tile, status pill and "need mushrooms…" text are left out: no data or service rule backs them.
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import type { RecipeSummary } from '../../domain/recipe';
import type { PantryMatch } from '../../services/findRecipesFromPantry';
import { formatIngredientsOnHand } from '../format/matchInfo';
import { formatDuration } from '../format/recipeInfo';
import { colors, fontSize, fontWeight, fonts, radii, shadows, spacing } from '../theme';

type Props = {
  recipe: RecipeSummary;
  /** Pantry counts for the "3/5 ingredients on hand" line; left out where there's no pantry match. */
  onHand?: Pick<PantryMatch, 'haveCount' | 'neededCount'>;
  onPress: () => void;
};

export function RecipeCard({ recipe, onHand, onPress }: Props) {
  // No accessibilityLabel: screen readers read the name, count and time from the text inside.
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Text style={styles.name}>{recipe.name}</Text>
      {onHand ? <Text style={styles.onHand}>{formatIngredientsOnHand(onHand)}</Text> : null}
      <Text style={styles.time}>{formatDuration(recipe.totalTimeMinutes)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  pressed: { opacity: 0.85 },
  name: {
    fontFamily: fonts.heading,
    fontSize: fontSize.cardTitle,
    fontWeight: fontWeight.semibold,
    lineHeight: 21,
    color: colors.text,
  },
  onHand: { marginTop: 3, fontSize: fontSize.meta, color: colors.textSecondary },
  time: { marginTop: 5, fontSize: fontSize.caption, color: colors.textMuted },
});
