// PRESENTATION LAYER: one filter chip, a pill with its label and how many recipes it holds.
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, fonts, fontSize, radii, spacing } from '../theme';
import { PressableScale } from './PressableScale';

type Props = {
  label: string;
  count: number;
  /** The label's color while the chip isn't selected. */
  color: string;
  selected: boolean;
  onPress: () => void;
};

export function FilterChip({ label, count, color, selected, onPress }: Props) {
  const textColor = selected ? colors.onAccent : color;
  return (
    <PressableScale
      size="small"
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${count}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      // Android fades the chip as one picture, not its fill and label separately (see AGENTS.md §5.2).
      needsOffscreenAlphaCompositing
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}
    >
      <Text style={[styles.label, selected && styles.selectedLabel, { color: textColor }]}>{label}</Text>
      <Text style={[styles.count, { color: textColor }]}>{count}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: 36,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  selected: { borderColor: colors.accent, backgroundColor: colors.accent },
  pressed: { opacity: 0.8 },
  label: { fontFamily: fonts.bold, fontSize: fontSize.meta },
  selectedLabel: { fontFamily: fonts.heavy },
  count: { fontFamily: fonts.bold, fontSize: fontSize.meta, opacity: 0.7 },
});
