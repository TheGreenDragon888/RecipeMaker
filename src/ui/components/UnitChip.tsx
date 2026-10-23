// PRESENTATION LAYER: one unit in the amount sheet's unit row, a pill the user taps to pick that unit (blue when
// picked). Exactly one is picked, so screen readers hear a choice (radio), not an on/off switch.
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, fontSize, radii, spacing } from '../theme';

type Props = {
  /** Display text, already formatted ("cups", "mL"). */
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function UnitChip({ label, selected, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.chip, selected ? styles.chipOn : styles.chipOff]}
    >
      {({ pressed }) => (
        <Text style={[styles.label, selected ? styles.labelOn : styles.labelOff, pressed && styles.pressed]}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minWidth: 88,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: 22,
    borderRadius: radii.pill,
    borderWidth: 1.5,
  },
  chipOn: { backgroundColor: colors.blueSoft, borderColor: colors.blue },
  chipOff: { backgroundColor: colors.surface, borderColor: colors.border },
  pressed: { opacity: 0.7 },
  label: { fontSize: fontSize.body },
  labelOn: { fontFamily: fonts.heavy, color: colors.blue },
  labelOff: { fontFamily: fonts.semibold, color: colors.text },
});
