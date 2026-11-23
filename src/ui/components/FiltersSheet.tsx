// PRESENTATION LAYER: the board's Filters sheet for All Recipes and Recipes for You: hands-on cooking time chips, a
// number-of-people stepper and a Meal Prep switch, over a dimmed screen, with a button that says how many recipes the
// choices show. It is built on BottomSheet, so it stands on the screen's bottom edge, slides the dock out of the way
// (dockSpot / onCoversDockChange), and closes on the backdrop, the grab bar, a drag down and Android's back button.
// The choices are a draft held here, so a tap redraws the sheet and not the recipe list behind it. The screen hears
// each change (onChange, to count the recipes) and gets the final choices when the sheet closes: every way of closing
// keeps them, since the count the button shows is already what the list will show. Reset clears them without closing.
// Dietary restrictions, also on the board, are left out until the recipe data says which recipes fit them.
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { activeFilterCount, type RecipeFilter } from '../../domain/recipeFilter';
import { formatHandsOnLimit, formatShowRecipes, HANDS_ON_CHOICES } from '../format/recipeFilters';
import { colors, fonts, fontSize, radii, spacing } from '../theme';
import { BottomSheet } from './BottomSheet';
import { ChoiceChip } from './ChoiceChip';
import { PeopleStepper } from './PeopleStepper';
import { PressableScale } from './PressableScale';
import { SheetFooterButton, SheetGrabBar } from './SheetParts';
import { ToggleSwitch } from './ToggleSwitch';

type Props = {
  open: boolean;
  /** The safe area's bottom inset (see BottomSheet). */
  bottomInset: number;
  /** The filters in force when the sheet opens; each opening starts from them. */
  value: RecipeFilter;
  /** How many recipes the choices show, or null while that is being counted. */
  count: number | null;
  /** Called with the whole set of choices after every change, so the screen can count again. */
  onChange: (draft: RecipeFilter) => void;
  /** Called with the choices when the sheet closes, however it is closed. */
  onClose: (draft: RecipeFilter) => void;
  dockSpot?: { bottom: number; top: number };
  onCoversDockChange?: (covers: boolean) => void;
};

/** The board's sheet is 656 px tall; on a short screen it leaves this much of the top free. */
const SHEET_MAX_HEIGHT = 656;
const TOP_ROOM = 100;

/** A copy of the filter with one condition set, or taken away when its value is undefined. */
function withCondition<K extends keyof RecipeFilter>(filter: RecipeFilter, key: K, value: RecipeFilter[K]): RecipeFilter {
  const next = { ...filter };
  if (value === undefined) delete next[key];
  else next[key] = value;
  return next;
}

export function FiltersSheet({ open, bottomInset, value, count, onChange, onClose, dockSpot, onCoversDockChange }: Props) {
  const { height: windowHeight } = useWindowDimensions();
  const [draft, setDraft] = useState<RecipeFilter>(value);
  const [wasOpen, setWasOpen] = useState(open);
  // Each opening starts from the filters in force (set while drawing, so the sheet never shows the last draft first).
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setDraft(value);
  }

  const change = (next: RecipeFilter) => {
    setDraft(next);
    onChange(next);
  };
  const close = () => onClose(draft);

  return (
    <BottomSheet
      open={open}
      bottomInset={bottomInset}
      closeLabel="Close filters"
      label="Filters"
      dockSpot={dockSpot}
      onCoversDockChange={onCoversDockChange}
      onClose={close}
    >
      {(dragHandlers) => (
        <View style={{ maxHeight: Math.min(SHEET_MAX_HEIGHT, windowHeight - TOP_ROOM) }}>
          <View testID="filters-sheet-drag-area" {...dragHandlers}>
            <SheetGrabBar label="Close filters" onPress={close} />
            <View style={styles.header}>
              <Text style={styles.title}>Filters</Text>
              {activeFilterCount(draft) > 0 ? (
                <PressableScale
                  size="small"
                  accessibilityRole="button"
                  accessibilityLabel="Reset filters"
                  onPress={() => change({})}
                  style={styles.reset}
                >
                  <Text style={styles.resetText}>Reset</Text>
                </PressableScale>
              ) : null}
            </View>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            <View style={[styles.section, styles.sectionRule]}>
              <View style={styles.sectionHead}>
                <View style={styles.sectionText}>
                  <Text style={styles.sectionTitle}>Hands-on cooking time</Text>
                  <Text style={styles.sectionNote}>Active cooking only, not total time</Text>
                </View>
                <Text style={styles.pill}>{formatHandsOnLimit(draft.maxActiveMinutes)}</Text>
              </View>
              <View style={styles.chips}>
                {HANDS_ON_CHOICES.map(({ minutes, label }) => (
                  <ChoiceChip
                    key={label}
                    label={label}
                    selected={draft.maxActiveMinutes === minutes}
                    wrapperStyle={styles.chipWrapper}
                    onPress={() => change(withCondition(draft, 'maxActiveMinutes', minutes))}
                  />
                ))}
              </View>
            </View>

            <View style={[styles.section, styles.sectionRule, styles.sectionRow]}>
              <Text style={styles.sectionTitle}>Number of people</Text>
              <PeopleStepper value={draft.people} onChange={(people) => change(withCondition(draft, 'people', people))} />
            </View>

            <View style={[styles.section, styles.sectionRow]}>
              <View style={styles.sectionText}>
                <Text style={styles.sectionTitle}>Meal Prep</Text>
                <Text style={styles.sectionNote}>Recipes that serve 4+ and keep well when made ahead.</Text>
              </View>
              <View style={styles.switchGroup}>
                <Text style={[styles.switchState, draft.mealPrepOnly && styles.switchStateOn]}>{draft.mealPrepOnly ? 'On' : 'Off'}</Text>
                <ToggleSwitch
                  label="Meal Prep"
                  value={draft.mealPrepOnly === true}
                  onValueChange={(on) => change(withCondition(draft, 'mealPrepOnly', on ? true : undefined))}
                />
              </View>
            </View>
          </ScrollView>

          <SheetFooterButton label={formatShowRecipes(count)} onPress={close} />
        </View>
      )}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xxs,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.sm,
  },
  title: { fontFamily: fonts.heading, fontSize: fontSize.sheetTitle, color: colors.text },
  reset: { paddingVertical: spacing.sm, paddingLeft: spacing.md },
  resetText: { fontFamily: fonts.heavy, fontSize: fontSize.body, color: colors.blue },
  body: { flexShrink: 1 },
  bodyContent: { paddingHorizontal: spacing.screen },
  section: { paddingVertical: spacing.md },
  sectionRule: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  sectionHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
  sectionText: { flexShrink: 1 },
  sectionTitle: { fontFamily: fonts.heavy, fontSize: fontSize.input, color: colors.text },
  sectionNote: { marginTop: spacing.xxs, fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary },
  pill: {
    overflow: 'hidden',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.blueSoft,
    fontFamily: fonts.heavy,
    fontSize: fontSize.caption,
    color: colors.blue,
  },
  chips: { flexDirection: 'row', gap: 6, marginTop: spacing.md },
  chipWrapper: { flex: 1, minWidth: 0 },
  switchGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  switchState: { fontFamily: fonts.heavy, fontSize: fontSize.meta, color: colors.textMuted },
  switchStateOn: { color: colors.blue },
});
