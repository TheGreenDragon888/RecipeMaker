// PRESENTATION LAYER: the autocomplete dropdown under the "Add an ingredient" field.
// The mockup's category dots/labels, "In pantry" markers and match-count footer are left out: no data backs them.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { IngredientSuggestion } from '../../domain/ingredientSuggestion';
import { splitOnTypedPrefix } from '../format/highlightPrefix';
import { formatIngredientName } from '../format/pantryInfo';
import { colors, fonts, fontSize, radii, shadows, spacing } from '../theme';

type Props = {
  suggestions: IngredientSuggestion[];
  /** What the user typed, so the matching start of each suggestion can be shown in bold. */
  typed: string;
  onSelect: (suggestion: string) => void;
};

export function SuggestionList({ suggestions, typed, onSelect }: Props) {
  // The shadow sits on an outer view: on iOS, overflow 'hidden' would clip a shadow on the same view.
  return (
    <View style={styles.shadow}>
      <View style={styles.list}>
        {suggestions.map((suggestion, index) => {
          const label = suggestion.matchedAlias
            ? `${suggestion.ingredient} (${suggestion.matchedAlias})`
            : suggestion.ingredient;
          // Each name is capitalized on its own, so the alias after "(" gets a capital too.
          const shown = suggestion.matchedAlias
            ? `${formatIngredientName(suggestion.ingredient)} (${formatIngredientName(suggestion.matchedAlias)})`
            : formatIngredientName(suggestion.ingredient);
          // The typed prefix matched the alias, not the start of the name, so nothing is bold.
          const split = suggestion.matchedAlias ? null : splitOnTypedPrefix(shown, typed);
          return (
            <Pressable
              key={suggestion.ingredient}
              accessibilityRole="button"
              accessibilityLabel={`Add ${label}`}
              onPress={() => onSelect(suggestion.ingredient)}
              // Android fades a pressed row as one picture, not its fill and text separately (see AGENTS.md §5.2).
              needsOffscreenAlphaCompositing
              // The mockup highlights the first row, like the top pick of a search.
              style={({ pressed }) => [styles.row, index === 0 && styles.rowHighlighted, pressed && styles.rowPressed]}
            >
              {split ? (
                <Text style={styles.name}>
                  <Text style={styles.match}>{split.match}</Text>
                  {split.rest}
                </Text>
              ) : (
                <Text style={styles.name}>{shown}</Text>
              )}
              <Text style={styles.add}>+ Add</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: { borderRadius: radii.md, backgroundColor: colors.surface, ...shadows.dropdown },
  list: {
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 48,
    paddingVertical: 11,
    paddingHorizontal: spacing.lg,
  },
  rowHighlighted: { backgroundColor: colors.pressed },
  // The fade shows a press on the first row too, which already has the highlight color.
  rowPressed: { backgroundColor: colors.pressed, opacity: 0.85 },
  name: { flex: 1, fontSize: fontSize.input, fontFamily: fonts.semibold, color: colors.text },
  match: { fontFamily: fonts.heavy, color: colors.accent },
  add: { fontFamily: fonts.bold, fontSize: fontSize.caption, color: colors.accent },
});
