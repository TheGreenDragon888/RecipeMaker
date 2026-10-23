// PRESENTATION LAYER: what the open seasoning tray shows: a grab bar, a header, on/off chips by section,
// and Done, as on the board's "Pantry — Seasoning Tray" artboard. It fills the sheet SeasoningDrawer draws
// (which also adds the dimmed backdrop and moves the sheet). The grab bar and Done close it, and the grab bar
// and header can be dragged through dragHandlers. Left out from the board: the "+ Add seasoning" chip
// (every seasoning is shown).
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type GestureResponderHandlers } from 'react-native';
import type { SeasoningGroup } from '../../domain/seasonings';
import { formatSeasoningName, formatSeasoningSection, formatTrayCount } from '../format/pantryInfo';
import { colors, fonts, fontSize, radii, spacing } from '../theme';
import { Icon } from './Icon';
import { SeasoningChip } from './SeasoningChip';

type Props = {
  groups: SeasoningGroup[];
  /** Names of the seasonings that are on (any case). */
  on: string[];
  onToggle: (name: string) => void;
  onClose: () => void;
  /** Responder handlers that let the grab bar and header drag the sheet. */
  dragHandlers?: Partial<GestureResponderHandlers>;
};

export function SeasoningTray({ groups, on, onToggle, onClose, dragHandlers }: Props) {
  const all = groups.flatMap((group) => group.seasonings);
  const onSet = new Set(on.map((name) => name.toLowerCase()));
  const isOn = (name: string) => onSet.has(name.toLowerCase());

  return (
    <View style={styles.tray}>
      <View testID="seasoning-tray-drag-area" {...dragHandlers}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close seasonings tray" onPress={onClose} style={styles.grabArea}>
          <View style={styles.grabber} />
        </Pressable>

        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Icon name="spiceJar" size={22} color={colors.blue} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Seasonings</Text>
            <Text style={styles.subtitle}>Tap what’s in your spice rack</Text>
          </View>
          <Text style={styles.badge}>{formatTrayCount(all.filter(isOn).length, all.length)}</Text>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {groups.map((group) => (
          <View key={group.section}>
            <Text style={styles.sectionTitle}>{formatSeasoningSection(group.section)}</Text>
            <View style={styles.chips}>
              {group.seasonings.map((name) => (
                <SeasoningChip
                  key={name}
                  label={formatSeasoningName(name, all)}
                  on={isOn(name)}
                  onToggle={() => onToggle(name)}
                />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable accessibilityRole="button" accessibilityLabel="Done" onPress={onClose} style={styles.done}>
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tray: { flex: 1 },
  grabArea: { height: 30, alignItems: 'center', justifyContent: 'center' },
  grabber: { width: 40, height: 5, borderRadius: 3, backgroundColor: colors.grabber },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.md,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blueSoft,
  },
  headerText: { flex: 1 },
  title: { fontFamily: fonts.heading, fontSize: 21, color: colors.text },
  subtitle: { fontFamily: fonts.regular, fontSize: fontSize.meta, color: colors.textSecondary },
  badge: {
    overflow: 'hidden',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.blueSoft,
    fontSize: fontSize.caption,
    fontFamily: fonts.heavy,
    color: colors.blue,
  },
  body: { flex: 1 },
  bodyContent: { paddingTop: spacing.xs, paddingHorizontal: spacing.screen, paddingBottom: spacing.sm },
  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: 10,
    fontSize: fontSize.caption,
    fontFamily: fonts.heavy,
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  footer: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  done: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    backgroundColor: colors.blue,
  },
  doneText: { fontSize: fontSize.emphasis, fontFamily: fonts.heavy, color: colors.onAccent },
});
