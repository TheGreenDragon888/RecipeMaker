// PRESENTATION LAYER: one seasoning in the tray, a pill the user taps to switch on (blue, with a check) or off.
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, fontSize, radii, spacing } from '../theme';
import { Icon } from './Icon';

type Props = {
  /** Display text, already formatted ("Fresh Basil"). */
  label: string;
  on: boolean;
  onToggle: () => void;
};

export function SeasoningChip({ label, on, onToggle }: Props) {
  return (
    <Pressable
      accessibilityRole="togglebutton"
      accessibilityState={{ checked: on }}
      onPress={onToggle}
      style={[styles.chip, on ? styles.chipOn : styles.chipOff]}
    >
      {({ pressed }) => (
        <>
          {on ? <Icon name="check" size={14} color={colors.blue} strokeWidth={3} /> : null}
          <Text style={[styles.label, on ? styles.labelOn : styles.labelOff, pressed && styles.pressed]}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
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
