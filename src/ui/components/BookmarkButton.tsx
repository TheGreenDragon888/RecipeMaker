// PRESENTATION LAYER: the bookmark icon that saves a recipe or removes it: filled while saved. On a card it is a
// plain 44 px touch target; in a footer it is the board's outlined 52 px button.
import React from 'react';
import { StyleSheet } from 'react-native';
import { formatBookmarkLabel } from '../format/bookmarks';
import { colors, radii } from '../theme';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

type Props = {
  recipeName: string;
  saved: boolean;
  onPress: () => void;
  variant?: 'card' | 'footer';
};

export function BookmarkButton({ recipeName, saved, onPress, variant = 'card' }: Props) {
  return (
    <PressableScale
      size="small"
      accessibilityRole="button"
      accessibilityLabel={formatBookmarkLabel(recipeName, saved)}
      accessibilityState={{ selected: saved }}
      onPress={onPress}
      // Android fades the footer button as one picture, not its fill and icon separately (see AGENTS.md §5.2).
      needsOffscreenAlphaCompositing
      style={({ pressed }) => [styles.button, variant === 'footer' ? styles.footer : styles.card, pressed && styles.pressed]}
    >
      <Icon name="bookmark" size={variant === 'footer' ? 21 : 22} color={colors.accent} strokeWidth={1.9} filled={saved} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: { alignItems: 'center', justifyContent: 'center' },
  card: { width: 44, height: 44 },
  footer: {
    width: 52,
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.7 },
});
