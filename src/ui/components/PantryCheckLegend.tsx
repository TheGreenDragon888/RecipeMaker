// PRESENTATION LAYER: the key above a recipe's ingredients: one chip for each circle its lines use.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatLegendLabel, type CheckMark } from '../format/pantryCheck';
import { fonts, fontSize, radii } from '../theme';
import { Icon } from './Icon';
import { MARK_LOOKS } from './IngredientMark';

/** Shows nothing when no circle is given. */
export function PantryCheckLegend({ marks }: { marks: CheckMark[] }) {
  if (marks.length === 0) return null;
  return (
    <View style={styles.legend}>
      {marks.map((mark) => {
        const look = MARK_LOOKS[mark];
        return (
          <View key={mark} style={[styles.chip, { backgroundColor: look.soft }]}>
            <Icon name={look.icon} size={look.iconSize} color={look.color} strokeWidth={look.strokeWidth} />
            <Text style={[styles.label, { color: look.color }]}>{formatLegendLabel(mark)}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  // The board pads the icon's side less, so the icon sits near the chip's rounded end.
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 5,
    paddingRight: 9,
    borderRadius: radii.pill,
  },
  label: { fontFamily: fonts.bold, fontSize: fontSize.label },
});
