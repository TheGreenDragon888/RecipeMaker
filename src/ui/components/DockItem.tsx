// PRESENTATION LAYER: one button in the bottom dock (an icon over a short label), as drawn on the board.
// The dock's tab navigator hands it isFocused and onPress; a disabled item stands for a tab that isn't built yet.
import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, dock, fonts, fontSize, radii, spacing } from '../theme';
import { Icon, type IconName } from './Icon';

type Props = {
  label: string;
  icon: IconName;
  /** True for the tab being shown. */
  isFocused?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  /** What screen readers say instead of the label, e.g. "Bookmarks, coming soon". */
  accessibilityLabel?: string;
};

export function DockItem({ label, icon, isFocused = false, disabled = false, onPress, accessibilityLabel }: Props) {
  const color = isFocused ? colors.accent : colors.textSecondary;
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected: isFocused, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        isFocused && styles.focused,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Icon name={icon} size={dock.iconSize} color={color} />
      <Text style={[styles.label, { color }, isFocused && styles.focusedLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  item: {
    width: dock.itemWidth,
    height: dock.itemHeight,
    borderRadius: radii.dockItem,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xxs,
  },
  focused: { backgroundColor: colors.accentTint },
  pressed: { opacity: 0.85 },
  disabled: { opacity: 0.5 },
  label: { fontSize: fontSize.label, fontFamily: fonts.bold },
  focusedLabel: { fontFamily: fonts.heavy },
});
