// PRESENTATION LAYER: the Filters button next to the search field (and under Results' title). It turns blue and
// shows how many filters are selected, as on the board.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSize, radii } from '../theme';
import { Icon } from './Icon';
import { PressableScale } from './PressableScale';

type Props = {
  /** How many filters are selected (domain/recipeFilter's activeFilterCount). */
  activeCount: number;
  onPress: () => void;
  /** Layout toward the parent (alignSelf, margins). */
  wrapperStyle?: React.ComponentProps<typeof PressableScale>['wrapperStyle'];
};

export function FiltersButton({ activeCount, onPress, wrapperStyle }: Props) {
  const active = activeCount > 0;
  const color = active ? colors.blue : colors.text;
  return (
    <PressableScale
      size="button"
      wrapperStyle={wrapperStyle}
      accessibilityRole="button"
      accessibilityLabel={active ? `Filters, ${activeCount} active` : 'Filters'}
      onPress={onPress}
      // Android fades the button as one picture, not its border, icon, label and badge separately (see AGENTS.md §5.2).
      needsOffscreenAlphaCompositing
      style={({ pressed }) => [styles.button, active && styles.active, pressed && styles.pressed]}
    >
      <Icon name="filters" size={18} color={color} strokeWidth={1.9} />
      <Text style={[styles.label, { color }]}>Filters</Text>
      {active ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{activeCount}</Text>
        </View>
      ) : null}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  active: { borderWidth: 1.5, borderColor: colors.blue, backgroundColor: colors.blueWash, paddingHorizontal: 13 },
  pressed: { opacity: 0.85 },
  label: { fontFamily: fonts.heavy, fontSize: fontSize.body },
  badge: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.pill,
    backgroundColor: colors.blue,
  },
  badgeText: { fontFamily: fonts.heavy, fontSize: fontSize.caption, color: colors.onAccent },
});
