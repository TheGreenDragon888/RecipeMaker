// PRESENTATION LAYER: the autocomplete dropdown under the "Add an ingredient" field.
// The mockup's category dots/labels, "In pantry" markers and match-count footer are left out: no data backs them.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { splitOnTypedPrefix } from '../format/highlightPrefix';
import { colors, fontSize, fontWeight, radii, shadows, spacing } from '../theme';

type Props = {
  suggestions: string[];
  /** What the user typed, so the matching start of each suggestion can be shown in bold. */
  typed: string;
  onSelect: (suggestion: string) => void;
};

export function SuggestionList({ suggestions, typed, onSelect }: Props) {
  return (
    <View style={styles.list}>
      {suggestions.map((suggestion) => {
        const split = splitOnTypedPrefix(suggestion, typed);
        return (
          <Pressable
            key={suggestion}
            accessibilityRole="button"
            accessibilityLabel={`Add ${suggestion}`}
            onPress={() => onSelect(suggestion)}
            style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
          >
            {split ? (
              <Text style={styles.name}>
                <Text style={styles.match}>{split.match}</Text>
                {split.rest}
              </Text>
            ) : (
              <Text style={styles.name}>{suggestion}</Text>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...shadows.dropdown,
  },
  row: { minHeight: 48, justifyContent: 'center', paddingVertical: 11, paddingHorizontal: spacing.lg },
  rowPressed: { backgroundColor: colors.pressed },
  name: { fontSize: fontSize.input, fontWeight: fontWeight.semibold, color: colors.text },
  match: { fontWeight: fontWeight.heavy, color: colors.accent },
});
