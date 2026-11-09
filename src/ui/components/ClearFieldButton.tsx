// PRESENTATION LAYER: the small X at the right end of a text field that empties it. The screen decides
// when to show it (only while the field has text) and what clearing does.
import React from 'react';
import { StyleSheet } from 'react-native';
import { colors, radii } from '../theme';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

type Props = {
  /** What screen readers announce, e.g. "Clear search". */
  label: string;
  onPress: () => void;
};

const SIZE = 24;
/** Reaches 12 px past each edge, so the touch area is 48 px: big enough for a thumb. */
const HIT_SLOP = 12;

export function ClearFieldButton({ label, onPress }: Props) {
  return (
    <PressableScale
      size="small"
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={HIT_SLOP}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}
    >
      <Icon name="close" size={16} color={colors.textMuted} strokeWidth={2} />
    </PressableScale>
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
  pressed: { backgroundColor: colors.pressed },
});
