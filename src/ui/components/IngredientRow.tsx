// PRESENTATION LAYER: one recipe ingredient, and how it compares with the pantry when there is one: its circle,
// "have 6 cloves" beside it, or what's wrong under it ("Not in your pantry") on a tinted row.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { PantryCheck } from '../../domain/pantryCheck';
import { checkMark, formatCheckDetail, formatCheckLabel, formatCheckNote, type CheckMark } from '../format/pantryCheck';
import { colors, fonts, fontSize, radii } from '../theme';
import { IngredientMark, MARK_LOOKS, MARK_SIZE } from './IngredientMark';

type Props = {
  /** The line as the recipe gives it: "3 cloves garlic, minced". */
  text: string;
  /** How the line compares with the pantry; left out when there is no pantry to compare with. */
  check?: PantryCheck;
  /** A thin line under the row; every row but the last has one. */
  divider: boolean;
};

/** The rows the board tints: a swap, one that is short, and one that is missing. */
const WASHES: Partial<Record<CheckMark, string>> = {
  swap: colors.blueWash,
  notEnough: colors.amberWash,
  missing: colors.accentWash,
};

export function IngredientRow({ text, check, divider }: Props) {
  if (!check) {
    return (
      <View style={[styles.row, divider && styles.divider]}>
        <Text style={styles.line}>{text}</Text>
      </View>
    );
  }

  const mark = checkMark(check);
  const wash = mark ? WASHES[mark] : undefined;
  const note = formatCheckNote(check);
  const detail = formatCheckDetail(check);
  return (
    <View
      accessible
      accessibilityLabel={`${text}. ${formatCheckLabel(check)}`}
      style={[styles.row, divider && styles.divider, wash !== undefined && [styles.tinted, { backgroundColor: wash }]]}
    >
      {mark ? <IngredientMark mark={mark} /> : <View style={styles.noMark} />}
      <View style={styles.middle}>
        <Text style={styles.line}>{text}</Text>
        {detail && mark ? (
          <Text style={[styles.detail, { color: MARK_LOOKS[mark].color }, mark !== 'swap' && styles.detailBold]}>{detail}</Text>
        ) : null}
      </View>
      {note ? <Text style={styles.note}>{note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // 9px above and below a 22px line (or circle) makes the board's 40px rows.
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  // A tinted row reaches 8px past the list on each side, so its text stays in line with the others.
  tinted: { paddingVertical: 10, paddingHorizontal: 8, marginHorizontal: -8, borderRadius: radii.sm },
  noMark: { width: MARK_SIZE },
  middle: { flex: 1 },
  line: { fontFamily: fonts.regular, fontSize: fontSize.body, lineHeight: 22, color: colors.text },
  detail: { marginTop: 2, fontFamily: fonts.regular, fontSize: fontSize.checkDetail },
  detailBold: { fontFamily: fonts.bold },
  note: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textMuted },
});
