// PRESENTATION LAYER: the mockup's round back button, used at the top of a screen.
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { colors, radii } from '../theme';
import { Icon } from './Icon';

type Props = {
  /** What screen readers announce, e.g. "Back to pantry". */
  label: string;
  onPress: () => void;
  /** Sits on the recipe banner: no outline, see-through fill (the mockup's detail screen). */
  overBanner?: boolean;
};

const SIZE = 38;

export function BackButton({ label, onPress, overBanner = false }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        overBanner ? styles.overBanner : styles.outlined,
        pressed && styles.pressed,
      ]}
    >
      <Icon name="chevronLeft" size={20} color={colors.text} strokeWidth={2} />
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
  },
  outlined: { borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  overBanner: { backgroundColor: colors.surfaceTranslucent },
  pressed: { backgroundColor: colors.pressed },
});
