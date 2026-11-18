// PRESENTATION LAYER: one recipe in a list (Recipes, Results, Bookmarks, Similar recipes), as drawn on the board: a
// tinted tile, the status pill, title, note and time. Without readiness (no pantry, or not checked yet) the tile is
// neutral and only the title, any on-hand count and the time show. Tapping it opens the recipe; where the screen gives
// it one, a bookmark button sits in its top corner. The button is beside the card's Pressable, not inside it, so a tap
// on it doesn't open the recipe and screen readers reach the two separately.
import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { RecipeSummary } from '../../domain/recipe';
import type { ReadinessStatus, RecipeReadiness } from '../../domain/recipeReadiness';
import type { PantryMatch } from '../../services/findRecipesFromPantry';
import { formatReadinessLabel, formatReadinessNote } from '../format/bookmarks';
import { formatIngredientsOnHand } from '../format/matchInfo';
import { formatDuration } from '../format/recipeInfo';
import { BookmarkButton } from './BookmarkButton';
import { PressableScale } from './PressableScale';
import { colors, fonts, fontSize, radii, shadows, spacing } from '../theme';
import { Icon } from './Icon';

type Props = {
  recipe: RecipeSummary;
  /** How ready it is to cook. Null or left out while it is being checked, or with no pantry to check against. */
  readiness?: RecipeReadiness | null;
  /** Pantry counts for the "3/5 ingredients on hand" line, shown when there is no readiness note. */
  onHand?: Pick<PantryMatch, 'haveCount' | 'neededCount'>;
  onPress: () => void;
  /**
   * Adds the bookmark button; left out where the screen doesn't offer one. `saved` is null until it is known,
   * which keeps the button's room but doesn't draw it.
   */
  bookmark?: { saved: boolean | null; onToggle: () => void };
};

type CardProps = Pick<Props, 'recipe' | 'readiness' | 'onHand' | 'onPress'> & { besideBookmark: boolean };

const NEUTRAL = { fg: colors.textSecondary, bg: colors.divider };
const STATUS_COLORS: Record<ReadinessStatus, { fg: string; bg: string }> = {
  ready: { fg: colors.green, bg: colors.greenSoft },
  swap: { fg: colors.blue, bg: colors.blueSoft },
  almost: { fg: colors.amber, bg: colors.amberSoft },
  needsMore: NEUTRAL,
};

function noteFor(readiness: RecipeReadiness | null | undefined, onHand: CardProps['onHand']): string | null {
  if (readiness) return formatReadinessNote(readiness);
  return onHand ? formatIngredientsOnHand(onHand) : null;
}

/** The card itself. Memoized, so tapping the bookmark redraws only the button. */
const Card = memo(function Card({ recipe, readiness, onHand, onPress, besideBookmark }: CardProps) {
  const { fg, bg } = readiness ? STATUS_COLORS[readiness.status] : NEUTRAL;
  const note = noteFor(readiness, onHand);
  const clearOfBookmark = besideBookmark && styles.clearOfBookmark;
  // No accessibilityLabel: screen readers read the status, name, note and time from the text inside.
  return (
    <PressableScale
      size="card"
      accessibilityRole="button"
      onPress={onPress}
      // Android fades the card as one picture, not its fill and text separately (see AGENTS.md §5.2).
      needsOffscreenAlphaCompositing
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.tile, { backgroundColor: bg }]}>
        <Icon name="utensils" size={30} color={fg} strokeWidth={1.6} />
      </View>
      <View style={styles.body}>
        {readiness ? (
          <Text style={[styles.pill, { color: fg, backgroundColor: bg }]}>{formatReadinessLabel(readiness)}</Text>
        ) : null}
        <Text style={[styles.name, clearOfBookmark]}>{recipe.name}</Text>
        {note ? <Text style={[styles.note, clearOfBookmark]}>{note}</Text> : null}
        <View style={styles.timeRow}>
          <Icon name="clock" size={13} color={colors.textMuted} />
          <Text style={styles.time}>{formatDuration(recipe.totalTimeMinutes)}</Text>
        </View>
      </View>
    </PressableScale>
  );
});

export function RecipeCard({ recipe, readiness, onHand, onPress, bookmark }: Props) {
  const card = (
    <Card recipe={recipe} readiness={readiness} onHand={onHand} onPress={onPress} besideBookmark={bookmark !== undefined} />
  );
  if (!bookmark) return card;
  return (
    <View>
      {card}
      {bookmark.saved !== null ? (
        <View style={styles.bookmark}>
          <BookmarkButton recipeName={recipe.name} saved={bookmark.saved} onPress={bookmark.onToggle} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: radii.xl,
    backgroundColor: colors.surface,
    ...shadows.card,
  },
  pressed: { opacity: 0.85 },
  tile: { width: 76, height: 76, alignItems: 'center', justifyContent: 'center', borderRadius: radii.md },
  body: { flex: 1, minWidth: 0 },
  pill: {
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: radii.pill,
    overflow: 'hidden',
    fontFamily: fonts.heavy,
    fontSize: fontSize.label,
  },
  name: { fontFamily: fonts.heading, fontSize: fontSize.cardTitle, lineHeight: 21, color: colors.text },
  note: { marginTop: 3, fontFamily: fonts.regular, fontSize: fontSize.meta, color: colors.textSecondary },
  clearOfBookmark: { paddingRight: 34 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: 5 },
  time: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textMuted },
  // Android draws by elevation first, so the button needs at least the card's to stay on top of it.
  bookmark: { position: 'absolute', top: spacing.sm, right: spacing.sm, elevation: shadows.card.elevation },
});
