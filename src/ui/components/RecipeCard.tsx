// PRESENTATION LAYER: one recipe in a list (Results, Similar recipes). Tapping it opens the recipe.
// The mockup's photo tile, status pill and "need mushrooms…" text are left out: no data or service rule backs them.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { RecipeSummary } from '../../domain/recipe';
import type { PantryMatch } from '../../services/findRecipesFromPantry';
import { formatIngredientsOnHand } from '../format/matchInfo';
import { formatDuration } from '../format/recipeInfo';
import { colors, fonts, fontSize, radii, shadows, spacing } from '../theme';
import { Icon } from './Icon';

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
      // Android fades the card as one picture, not its fill and text separately (see AGENTS.md §5.2).
      needsOffscreenAlphaCompositing
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Text style={styles.name}>{recipe.name}</Text>
      {onHand ? <Text style={styles.onHand}>{formatIngredientsOnHand(onHand)}</Text> : null}
      <View style={styles.timeRow}>
        <Icon name="clock" size={13} color={colors.textMuted} />
        <Text style={styles.time}>{formatDuration(recipe.totalTimeMinutes)}</Text>
      </View>
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
    lineHeight: 21,
    color: colors.text,
  },
  onHand: { marginTop: 3, fontFamily: fonts.regular, fontSize: fontSize.meta, color: colors.textSecondary },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 5 },
  time: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textMuted },
});
