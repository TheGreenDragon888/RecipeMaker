// PRESENTATION LAYER: one numbered step of a recipe, with the mockup's amber number circle.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, fontWeight, radii, spacing } from '../theme';

type Props = {
  number: number;
  text: string;
};

export function StepItem({ number, text }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.badge}>
        <Text style={styles.number}>{String(number)}</Text>
      </View>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
}

const BADGE_SIZE = 24;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.lg },
  badge: {
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.amberSoft,
  },
  number: { fontSize: fontSize.caption, fontWeight: fontWeight.heavy, color: colors.amber },
  text: { flex: 1, fontSize: fontSize.body, lineHeight: 21, color: colors.text },
});
