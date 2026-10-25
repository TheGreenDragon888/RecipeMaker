// PRESENTATION LAYER: the full-width accent button ("Find recipes with 8 ingredients" plus an arrow, "Return to Pantry").
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fonts, fontSize, radii, spacing } from '../theme';
import { Icon } from './Icon';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** Adds the mockup's trailing arrow icon. Screen readers hear only the label. */
  showArrow?: boolean;
};

export function PrimaryButton({ label, onPress, disabled = false, showArrow = false }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      // Android fades the button as one picture, not its fill and label separately (see AGENTS.md §5.2).
      needsOffscreenAlphaCompositing
      style={({ pressed }) => [styles.button, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Text style={styles.label}>{label}</Text>
      {showArrow ? <Icon name="arrowRight" size={18} color={colors.onAccent} strokeWidth={2} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
    borderRadius: radii.lg,
    backgroundColor: colors.accent,
  },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  label: { color: colors.onAccent, fontSize: fontSize.emphasis, fontFamily: fonts.heavy },
});
