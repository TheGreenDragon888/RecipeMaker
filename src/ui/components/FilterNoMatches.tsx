// PRESENTATION LAYER: what All Recipes shows when the selected filters leave no recipe, as on the board: a tile with a
// crossed magnifier, the filters that can't be met together in bold, and a hint to loosen one.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { noRecipeFitsSegments } from '../format/recipeFilters';
import { colors, fonts, fontSize, spacing } from '../theme';
import { Icon } from './Icon';

type Props = {
  /** The selected filters, named for a sentence (format/recipeFilters' filterParts). */
  parts: string[];
};

export function FilterNoMatches({ parts }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.tile}>
        <Icon name="searchOff" size={32} color={colors.accent} strokeWidth={1.6} />
      </View>
      <Text style={styles.title}>No recipes match your filters</Text>
      <Text style={styles.body}>
        {noRecipeFitsSegments(parts).map(({ text, bold }, index) => (
          <Text key={index} style={bold ? styles.bold : undefined}>
            {text}
          </Text>
        ))}
      </Text>
      <Text style={styles.hint}>Open Filters to loosen one of them.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxxl, paddingBottom: spacing.xxxl },
  tile: { width: 68, height: 68, alignItems: 'center', justifyContent: 'center', borderRadius: 22, backgroundColor: colors.accentSoft },
  title: { marginTop: 18, fontFamily: fonts.heading, fontSize: 21, color: colors.text, textAlign: 'center' },
  body: {
    marginTop: spacing.sm,
    maxWidth: 280,
    fontFamily: fonts.regular,
    fontSize: fontSize.body,
    lineHeight: 21,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  bold: { fontFamily: fonts.heavy, color: colors.text },
  hint: { marginTop: 10, fontFamily: fonts.regular, fontSize: fontSize.meta, color: colors.textMuted, textAlign: 'center' },
});
