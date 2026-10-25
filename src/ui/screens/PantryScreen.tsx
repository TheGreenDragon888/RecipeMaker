// PRESENTATION LAYER: "My Pantry" — the user lists the ingredients they have, with autocomplete.
// Only ingredients in the database can be added: a tapped suggestion, or typed text that findIngredient
// recognizes. Each ingredient has an amount in its pantry unit (− / +, up to 99; − removes it when one step
// would leave nothing). Tapping the amount opens the amount sheet, to type an amount or show the item in
// another unit (2 cups as 32 tbsp). Seasonings are switched on and off in the seasoning tray instead, and
// staples aren't added, since recipes already assume them. Only one of the tray and the sheet is open at a time.
// Amounts and units are display only: onFindRecipes gets the names of the list's ingredients and of the
// seasonings that are on, and the Results screen runs the pantry search with them.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Keyboard, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { RecipeServices } from '../../createRecipeServices';
import type { IngredientSuggestion } from '../../domain/ingredientSuggestion';
import {
  addPantryItem,
  canIncreasePantryQuantity,
  decreasePantryQuantity,
  decreaseRemovesPantryItem,
  increasePantryQuantity,
  pantryNamesForMatching,
  pantryStepUnit,
  setPantryItemAmount,
  shownPantryAmount,
  toggleSeasoning,
  turnOnSeasoning,
  type PantryItem,
} from '../../domain/pantry';
import { pantryKindOf, type PantryCatalog } from '../../domain/pantryCatalog';
import { pantryUnitChoices, type UnitChoice } from '../../domain/unitConversions';
import { AmountSheet } from '../components/AmountSheet';
import { BottomSheet } from '../components/BottomSheet';
import { Icon } from '../components/Icon';
import { PantryItemRow } from '../components/PantryItemRow';
import { PrimaryButton } from '../components/PrimaryButton';
import { SeasoningDrawer } from '../components/SeasoningDrawer';
import { SuggestionList } from '../components/SuggestionList';
import { formatMealTagline } from '../format/mealTagline';
import {
  formatFindRecipesLabel,
  formatSeasoningAdded,
  formatStapleAssumed,
  formatUnknownIngredient,
} from '../format/pantryInfo';
import { colors, dock, fonts, fontSize, radii, shadows, spacing } from '../theme';

type Props = {
  services: RecipeServices;
  onFindRecipes: (pantry: string[]) => void;
  /** The clock that picks the tagline; tests pass a fixed time. */
  now?: () => Date;
  /** Room to leave at the bottom for the tab bar (platform/dockLayout's tabScreenClearance). Defaults to the board's. */
  bottomClearance?: number;
  /** The safe area's bottom inset, so the amount sheet can rise above the keyboard (see platform/keyboardLift). */
  bottomInset?: number;
};

/** Which sheet is open: the seasoning tray, or the amount sheet for one ingredient. Never both. */
type OpenPanel = { kind: 'seasonings' } | { kind: 'amount'; name: string; opening: number } | null;

export function PantryScreen({
  services,
  onFindRecipes,
  now = () => new Date(),
  bottomClearance = dock.clearance,
  bottomInset = 0,
}: Props) {
  const [pantry, setPantry] = useState<PantryItem[]>([]);
  const [text, setText] = useState('');
  const [suggestions, setSuggestions] = useState<IngredientSuggestion[]>([]);
  /**
   * A one-line message under the field, or null. Information ("Paprika is on in Seasonings.") hides itself
   * after NOTICE_MS; problems (suggestions failed, unknown ingredient) stay until the user types.
   */
  const [notice, setNotice] = useState<Notice | null>(null);
  const noticeOpacity = useRef(new Animated.Value(1)).current;
  const [focused, setFocused] = useState(false);
  /** Where the dropdown's top goes: just under the field, from the field's area as measured on screen. */
  const [dropdownTop, setDropdownTop] = useState<number | undefined>(undefined);
  // Numbers each request so a slow reply for older text can't act on newer text.
  const latestRequest = useRef(0);
  /** Units and the seasoning tray, loaded once. Until it loads (or if it fails), items get no unit and there's no tray. */
  const [catalog, setCatalog] = useState<PantryCatalog>(EMPTY_CATALOG);
  const [catalogFailed, setCatalogFailed] = useState(false);
  const [seasoningsOn, setSeasoningsOn] = useState<string[]>([]);
  const [panel, setPanel] = useState<OpenPanel>(null);
  /** Counts openings of the amount sheet, so each one starts a fresh draft. */
  const openings = useRef(0);
  const trayOpen = panel?.kind === 'seasonings';
  const amountItem = panel?.kind === 'amount' ? pantry.find((item) => item.name === panel.name) : undefined;

  useEffect(() => {
    noticeOpacity.setValue(1);
    if (!notice?.hidesItself) return;
    const fade = setTimeout(() => {
      Animated.timing(noticeOpacity, { toValue: 0, duration: NOTICE_FADE_MS, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setNotice((current) => (current === notice ? null : current));
      });
    }, NOTICE_MS - NOTICE_FADE_MS);
    return () => {
      clearTimeout(fade);
      noticeOpacity.stopAnimation();
    };
  }, [notice, noticeOpacity]);

  useEffect(() => {
    let current = true;
    services.getPantryCatalog().then(
      (loaded) => {
        if (current) setCatalog(loaded);
      },
      () => {
        if (current) setCatalogFailed(true);
      },
    );
    return () => {
      current = false;
    };
  }, [services]);

  function changeText(value: string) {
    setText(value);
    setNotice(null);
    const request = ++latestRequest.current;
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }
    services.suggestIngredients(value).then(
      (found) => {
        if (request === latestRequest.current) setSuggestions(found);
      },
      () => {
        if (request !== latestRequest.current) return;
        setSuggestions([]);
        setNotice(problem("Couldn't load suggestions"));
      },
    );
  }

  /** Adds a picked ingredient: a list item in its unit, a seasoning switched on, or a staple (not added). */
  function add(ingredient: string) {
    const kind = pantryKindOf(catalog, ingredient);
    if (kind.kind === 'count') setPantry((current) => addPantryItem(current, ingredient, kind.unit));
    if (kind.kind === 'seasoning') setSeasoningsOn((current) => turnOnSeasoning(current, ingredient));
    latestRequest.current += 1; // Replies still on their way are for text we're clearing.
    setText('');
    setSuggestions([]);
    if (kind.kind === 'seasoning') setNotice(information(formatSeasoningAdded(ingredient)));
    else if (kind.kind === 'staple') setNotice(information(formatStapleAssumed(ingredient)));
    else setNotice(null);
  }

  /** Done key: add the ingredient the text names, else the first suggestion for it, else say it's unknown. */
  async function submit() {
    const typed = text;
    if (!typed.trim()) return;
    const request = ++latestRequest.current;
    const stillCurrent = () => request === latestRequest.current;
    try {
      const known = await services.findIngredient(typed);
      if (!stillCurrent()) return;
      if (known) return add(known);
      const suggested = await services.suggestIngredients(typed);
      if (!stillCurrent()) return;
      if (suggested.length > 0) return add(suggested[0].ingredient);
      setSuggestions([]);
      setNotice(problem(formatUnknownIngredient(typed)));
    } catch {
      if (stillCurrent()) setNotice(problem("Couldn't check that ingredient"));
    }
  }

  function increase(name: string) {
    setPantry((current) => increasePantryQuantity(current, name));
  }

  function decrease(name: string) {
    setPantry((current) => decreasePantryQuantity(current, name));
  }

  function toggle(name: string) {
    setSeasoningsOn((current) => toggleSeasoning(current, name));
  }

  /** Opens the amount sheet for one ingredient (closing the tray, and the add field's keyboard). */
  function editAmount(name: string) {
    Keyboard.dismiss();
    openings.current += 1;
    setPanel({ kind: 'amount', name, opening: openings.current });
  }

  function saveAmount(name: string, amount: number, unit: string | null) {
    setPantry((current) => setPantryItemAmount(current, name, amount, unit));
    setPanel(null);
  }

  /** Closes a panel only if it is still the one open (a tray settling after a drag can't close the sheet). */
  const close = (kind: 'seasonings' | 'amount') => setPanel((current) => (current?.kind === kind ? null : current));

  const unitChoices = (item: PantryItem): UnitChoice[] => (item.unit ? pantryUnitChoices(item.name, item.unit) : []);

  const names = pantryNamesForMatching(pantry, seasoningsOn);
  const hasTray = catalog.seasoningGroups.length > 0;
  const listBottom = bottomClearance + FIND_BUTTON_SPACE + (hasTray ? TRAY_HANDLE_SPACE : 0);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>My Pantry</Text>
        <Text style={styles.tagline} numberOfLines={1}>
          {formatMealTagline(now().getHours())}
        </Text>
      </View>

      <View
        style={styles.addArea}
        testID="add-area"
        onLayout={(event) => {
          const { y, height } = event.nativeEvent.layout;
          setDropdownTop(y + height + spacing.sm);
        }}
      >
        <View style={[styles.field, focused && styles.fieldFocused]}>
          <Icon name="search" size={18} color={colors.textMuted} />
          <TextInput
            accessibilityLabel="Add an ingredient"
            autoCapitalize="none"
            autoCorrect={false}
            onBlur={() => setFocused(false)}
            onChangeText={changeText}
            onFocus={() => setFocused(true)}
            onSubmitEditing={submit}
            placeholder="Add an ingredient…"
            placeholderTextColor={colors.textMuted}
            returnKeyType="done"
            style={styles.input}
            submitBehavior="submit"
            value={text}
          />
        </View>
      </View>

      <ScrollView style={styles.list} contentContainerStyle={[styles.listContent, { paddingBottom: listBottom }]} keyboardShouldPersistTaps="handled">
        {catalogFailed ? <Text style={styles.hint}>Couldn’t load units and seasonings.</Text> : null}
        {pantry.length === 0 ? (
          <Text style={styles.hint}>Add the ingredients you have.</Text>
        ) : (
          pantry.map((item) => {
            const shown = shownPantryAmount(item);
            const stepUnit = pantryStepUnit(item);
            return (
              <PantryItemRow
                key={item.name}
                name={item.name}
                quantity={shown.amount}
                unit={shown.unit}
                approximate={shown.approximate}
                stepUnit={stepUnit !== shown.unit ? stepUnit : null}
                canIncrease={canIncreasePantryQuantity(item)}
                decreaseRemoves={decreaseRemovesPantryItem(item)}
                onIncrease={() => increase(item.name)}
                onDecrease={() => decrease(item.name)}
                onEditAmount={() => editAmount(item.name)}
                hasOtherUnits={unitChoices(item).length > 1}
              />
            );
          })
        )}
      </ScrollView>

      <View style={[styles.footer, { bottom: bottomClearance }]}>
        <PrimaryButton
          label={formatFindRecipesLabel(names.length)}
          onPress={() => onFindRecipes(names)}
          disabled={names.length === 0}
          showArrow
        />
      </View>

      {hasTray ? (
        <SeasoningDrawer
          groups={catalog.seasoningGroups}
          on={seasoningsOn}
          bottom={bottomClearance}
          handleBottom={bottomClearance + TRAY_HANDLE_OFFSET}
          open={trayOpen}
          onOpen={() => setPanel({ kind: 'seasonings' })}
          onClose={() => close('seasonings')}
          onToggle={toggle}
        />
      ) : null}

      <BottomSheet
        open={amountItem !== undefined}
        bottom={bottomClearance}
        bottomInset={bottomInset}
        closeLabel="Close without saving"
        label="Amount and unit"
        onClose={() => close('amount')}
      >
        {amountItem && panel?.kind === 'amount' ? (
          <AmountSheet
            key={panel.opening}
            item={amountItem}
            choices={unitChoices(amountItem)}
            onSave={(amount, unit) => saveAmount(amountItem.name, amount, unit)}
            onClose={() => close('amount')}
          />
        ) : null}
      </BottomSheet>

      {/*
        The suggestions and notices float from the screen itself, just under the field. Android clips a view to
        its parent's edges here, so hanging them out of the field's area would leave them undrawn. Last, so
        they're drawn over the list, the tray and the sheet, as the field's area was.
      */}
      {suggestions.length > 0 || notice ? (
        <View style={[styles.dropdown, { top: dropdownTop }]} testID="field-dropdown">
          {suggestions.length > 0 ? <SuggestionList suggestions={suggestions} typed={text} onSelect={add} /> : null}
          {notice ? (
            <Animated.View style={{ opacity: noticeOpacity }}>
              <Text style={styles.notice}>{notice.text}</Text>
            </Animated.View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

type Notice = { text: string; hidesItself: boolean };
const information = (text: string): Notice => ({ text, hidesItself: true });
const problem = (text: string): Notice => ({ text, hidesItself: false });

/** How long an information notice stays, including its fade-out at the end. */
const NOTICE_MS = 3000;
const NOTICE_FADE_MS = 200;

/** The find button's height (about 54 px) plus a gap, for the list's bottom padding. */
const FIND_BUTTON_SPACE = 70;
/** The closed tray handle's bottom edge sits this far above the find button's (the board: 162 px vs 100 px). */
const TRAY_HANDLE_OFFSET = 62;
/** The handle's height (52 px) plus a gap, added to the list's bottom padding when the handle shows. */
const TRAY_HANDLE_SPACE = 62;

const EMPTY_CATALOG: PantryCatalog = { units: {}, seasoningGroups: [] };

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingTop: spacing.screenTop,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xs,
  },
  title: { fontFamily: fonts.heading, fontSize: fontSize.pantryTitle, color: colors.text },
  tagline: { flexShrink: 1, fontFamily: fonts.handwritten, fontSize: 20, color: colors.accent },
  addArea: { marginTop: spacing.lg, marginBottom: 6, marginHorizontal: spacing.screen },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  fieldFocused: { borderWidth: 1.5, borderColor: colors.accent },
  // paddingHorizontal 0: Android adds its own side padding to a TextInput; the field already has it.
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSize.input,
    color: colors.text,
    paddingVertical: 10,
    paddingHorizontal: 0,
  },
  // Floats over the pantry list, the same width as the text field (its top is set in the JSX). Android draws
  // the screen's views in order of elevation first, so it needs the find button's elevation to cover it.
  dropdown: {
    position: 'absolute',
    left: spacing.screen,
    right: spacing.screen,
    gap: spacing.sm,
    elevation: shadows.floatingButton.elevation,
  },
  notice: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    fontFamily: fonts.regular,
    fontSize: fontSize.caption,
    color: colors.textSecondary,
    overflow: 'hidden',
  },
  list: { flex: 1 },
  // The bottom padding, set in the JSX, lets the last ingredient scroll above the find button and the dock.
  listContent: { paddingTop: 6, paddingHorizontal: spacing.screen },
  hint: { paddingVertical: spacing.lg, fontFamily: fonts.regular, fontSize: fontSize.body, color: colors.textSecondary },
  // Floats over the list, just above the bottom dock, as on the board (its bottom is set in the JSX).
  footer: {
    position: 'absolute',
    left: spacing.screen,
    right: spacing.screen,
    borderRadius: radii.lg,
    ...shadows.floatingButton,
  },
});
