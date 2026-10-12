// PRESENTATION LAYER: the full-width accent button ("Find recipes with 8 ingredients →", "Return to Pantry").
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fontSize, fontWeight, radii, spacing } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** Adds a trailing "→" (a stand-in for the mockup's arrow icon). Screen readers hear only the label. */
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
      style={({ pressed }) => [styles.button, pressed && styles.pressed, disabled && styles.disabled]}
    >
      <Text style={styles.label}>{label}</Text>
      {showArrow ? <Text style={styles.label}>→</Text> : null}
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
  label: { color: colors.onAccent, fontSize: fontSize.emphasis, fontWeight: fontWeight.heavy },
});
