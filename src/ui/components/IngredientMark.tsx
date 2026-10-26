// PRESENTATION LAYER: the colored circle at the start of a recipe line, showing how it compares with the pantry:
// a green check (have), blue arrows (swap), an amber dash (not enough) or a clay cross (missing).
import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { CheckMark } from '../format/pantryCheck';
import { colors, radii } from '../theme';
import { Icon, type IconName } from './Icon';

/** Each circle's icon, its color, and the soft color behind it, with the board's icon sizes and stroke widths. */
export const MARK_LOOKS: Record<CheckMark, { icon: IconName; iconSize: number; strokeWidth: number; color: string; soft: string }> = {
  have: { icon: 'check', iconSize: 12, strokeWidth: 3, color: colors.green, soft: colors.greenSoft },
  swap: { icon: 'swap', iconSize: 12, strokeWidth: 2.2, color: colors.blue, soft: colors.blueSoft },
  notEnough: { icon: 'minus', iconSize: 13, strokeWidth: 2.4, color: colors.amber, soft: colors.amberSoft },
  missing: { icon: 'close', iconSize: 12, strokeWidth: 2.6, color: colors.accent, soft: colors.accentSoft },
};

/** The circle's size; a row without a circle leaves this much room so its text lines up. */
export const MARK_SIZE = 22;

export function IngredientMark({ mark }: { mark: CheckMark }) {
  const look = MARK_LOOKS[mark];
  return (
    <View style={[styles.circle, { backgroundColor: look.soft }]}>
      <Icon name={look.icon} size={look.iconSize} color={look.color} strokeWidth={look.strokeWidth} />
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: MARK_SIZE,
    height: MARK_SIZE,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
