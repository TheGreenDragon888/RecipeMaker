// PRESENTATION LAYER: the round back button from the mockup's detail banner, used at the top of a screen.
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, fontWeight, radii } from '../theme';

type Props = {
  /** What screen readers announce, e.g. "Back to pantry". */
  label: string;
  onPress: () => void;
};

const SIZE = 38;

export function BackButton({ label, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      {/* A stand-in for the mockup's chevron icon until icons are approved. */}
      <Text style={styles.chevron}>‹</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: SIZE,
    height: SIZE,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: { backgroundColor: colors.pressed },
  chevron: { fontSize: 28, lineHeight: 30, fontWeight: fontWeight.semibold, color: colors.text, marginTop: -2 },
});
