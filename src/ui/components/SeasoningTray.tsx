// PRESENTATION LAYER: what the open seasoning tray shows: a grab bar, a header, on/off chips by section,
// and Done, as on the board's "Pantry — Seasoning Tray" artboard. It fills the sheet SeasoningDrawer draws
// (which also adds the dimmed backdrop and moves the sheet). The grab bar and Done close it, and the grab bar
// and header can be dragged through dragHandlers. Left out from the board: the "+ Add seasoning" chip
// (every seasoning is shown).
import React from 'react';
import { ScrollView, StyleSheet, View, type GestureResponderHandlers } from 'react-native';
import type { SeasoningGroup } from '../../domain/seasonings';
import { formatSeasoningName, formatSeasoningSection, formatTrayCount } from '../format/pantryInfo';
import { spacing } from '../theme';
import { SeasoningChip } from './SeasoningChip';
import { SheetFooterButton, SheetGrabBar, SheetHeader, SheetSectionLabel } from './SheetParts';

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
        <SheetGrabBar label="Close seasonings tray" onPress={onClose} />
        <SheetHeader
          icon="spiceJar"
          title="Seasonings"
          subtitle="Tap what’s in your spice rack"
          badge={formatTrayCount(all.filter(isOn).length, all.length)}
        />
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {groups.map((group) => (
          <View key={group.section}>
            <View style={styles.sectionTitle}>
              <SheetSectionLabel text={formatSeasoningSection(group.section)} />
            </View>
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

      <SheetFooterButton label="Done" onPress={onClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  tray: { flex: 1 },
  body: { flex: 1 },
  bodyContent: { paddingTop: spacing.xs, paddingHorizontal: spacing.screen, paddingBottom: spacing.sm },
  sectionTitle: { marginTop: spacing.xl, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
});
