// PRESENTATION LAYER: one chip in the Filters sheet (a hands-on time such as "30 min"). Blue when selected, as on the board.
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, fonts, spacing } from '../theme';
import { PressableScale } from './PressableScale';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Layout toward the row of chips (a chip that shares the row's width equally sets flex here). */
  wrapperStyle?: React.ComponentProps<typeof PressableScale>['wrapperStyle'];
};

export function ChoiceChip({ label, selected, onPress, wrapperStyle }: Props) {
  return (
    <PressableScale
      size="small"
      wrapperStyle={wrapperStyle}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      // Android fades the chip as one picture, not its fill and label separately (see AGENTS.md §5.2).
      needsOffscreenAlphaCompositing
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}
    >
      <Text style={[styles.label, selected && styles.selectedLabel]} numberOfLines={1}>
        {label}
      </Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 999,
    backgroundColor: colors.surface,
  },
  selected: { borderColor: colors.blue, backgroundColor: colors.blueSoft },
  pressed: { opacity: 0.8 },
  label: { fontFamily: fonts.semibold, fontSize: 13.5, color: colors.text },
  selectedLabel: { fontFamily: fonts.heavy, color: colors.blue },
});
