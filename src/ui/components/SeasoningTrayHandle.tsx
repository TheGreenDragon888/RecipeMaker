// PRESENTATION LAYER: the closed seasoning tray, a handle above "Find recipes" ("Seasonings · 4 on hand").
// SeasoningDrawer places it; tapping it opens the tray, and dragging it up pulls the tray out. Its grab bar
// shows it pulls up, so it leaves out the board's ^ chevron. With `fill` it stretches to cover the whole
// growing sheet, so nothing under it shows through while it fades.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatOnHand } from '../format/pantryInfo';
import { colors, fonts, fontSize, radii, shadows, spacing } from '../theme';
import { Icon } from './Icon';

/** The handle's height; SeasoningDrawer shrinks the sheet to it. */
export const SEASONING_HANDLE_HEIGHT = 52;

type Props = {
  /** How many seasonings are on. */
  onCount: number;
  onOpen: () => void;
  /** Stretch to fill the space it is given, instead of keeping to its own height. */
  fill?: boolean;
};

export function SeasoningTrayHandle({ onCount, onOpen, fill = false }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open seasonings tray"
      onPress={onOpen}
      style={[styles.handle, fill && styles.fill]}
    >
      <View style={styles.grabber} />
      <View style={styles.row}>
        <Icon name="spiceJar" size={18} color={colors.blue} />
        <Text style={styles.title}>Seasonings</Text>
        <Text style={styles.badge}>{formatOnHand(onCount)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  handle: {
    minHeight: SEASONING_HANDLE_HEIGHT,
    alignItems: 'center',
    gap: 6,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.xl,
    ...shadows.trayHandle,
  },
  fill: { flex: 1 },
  grabber: { width: 36, height: 4, borderRadius: 2, backgroundColor: colors.grabber },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontSize: fontSize.body, fontFamily: fonts.heavy, color: colors.text },
  badge: {
    overflow: 'hidden',
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.pill,
    backgroundColor: colors.blueSoft,
    fontSize: fontSize.caption,
    fontFamily: fonts.heavy,
    color: colors.blue,
  },
});
