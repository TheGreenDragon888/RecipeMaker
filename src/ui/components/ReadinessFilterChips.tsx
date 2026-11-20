// PRESENTATION LAYER: the row of filter chips for how ready recipes are to cook, on Bookmarks and Results. It scrolls
// sideways when the chips don't fit.
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import type { ReadinessFilter } from '../../domain/recipeReadiness';
import { BOOKMARK_FILTER_LABELS } from '../format/bookmarks';
import { colors, spacing } from '../theme';
import { FilterChip } from './FilterChip';

type Props = {
  selected: ReadinessFilter;
  /** How many recipes each chip holds. */
  counts: Record<ReadinessFilter, number>;
  onSelect: (filter: ReadinessFilter) => void;
};

const FILTERS: { id: ReadinessFilter; color: string }[] = [
  { id: 'all', color: colors.text },
  { id: 'ready', color: colors.green },
  { id: 'swap', color: colors.blue },
  { id: 'almost', color: colors.amber },
];

export function ReadinessFilterChips({ selected, counts, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      style={styles.row}
      contentContainerStyle={styles.content}
    >
      {FILTERS.map(({ id, color }) => (
        <FilterChip
          key={id}
          label={BOOKMARK_FILTER_LABELS[id]}
          count={counts[id]}
          color={color}
          selected={selected === id}
          onPress={() => onSelect(id)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { flexGrow: 0 },
  content: { gap: spacing.sm, paddingTop: spacing.md, paddingBottom: 10, paddingHorizontal: spacing.screen },
});
