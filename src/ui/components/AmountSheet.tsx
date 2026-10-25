// PRESENTATION LAYER: what the amount sheet shows, as on the board's "Pantry — Amount & Unit Sheet" artboard:
// a grab bar, a header ("Garlic", "Counted in cloves", "Now 2 cloves"), the amount with −5 / −1 / +1 / +5 and a
// number field, a row of unit chips, and Save. It fills the BottomSheet the screen draws. It edits a draft:
// Save hands the amount and unit to onSave; the grab bar (like the backdrop) closes without saving.
// Unlike the board, picking a unit converts the amount (2 cups → 32 tbsp) rather than only relabelling it.
// Left out from the board: the category and "profile" in the header (no data), and "Common amounts".
import React, { useState } from 'react';
import { Keyboard, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { isValidPantryAmount, pantryAmountLimit, shownPantryAmount, stepDraftAmount, type PantryItem } from '../../domain/pantry';
import { convertPantryAmount, type UnitChoice } from '../../domain/unitConversions';
import {
  ESTIMATE_NOTE,
  formatAmountForInput,
  formatAmountLimit,
  formatCountedIn,
  formatNowBadge,
  formatSheetStepLabel,
  formatUnitChoice,
  parseAmountText,
} from '../format/pantryAmount';
import { formatIngredientName, formatPantryUnit } from '../format/pantryInfo';
import { colors, fonts, fontSize, radii, spacing } from '../theme';
import { SheetFooterButton, SheetGrabBar, SheetHeader, SheetSectionLabel } from './SheetParts';
import { UnitChip } from './UnitChip';

type Props = {
  item: PantryItem;
  /** The units it can be shown in (pantryUnitChoices); one or none hides the unit row. */
  choices: UnitChoice[];
  onSave: (amount: number, unit: string | null) => void;
  onClose: () => void;
};

const STEPS = [-5, -1, 1, 5];

export function AmountSheet({ item, choices, onSave, onClose }: Props) {
  const onHand = shownPantryAmount(item);
  const [unit, setUnit] = useState(onHand.unit);
  /** The draft amount, exact: the field shows it rounded, so a unit change there and back doesn't drift. */
  const [amount, setAmount] = useState<number | null>(onHand.amount);
  const [text, setText] = useState(formatAmountForInput(onHand.amount, onHand.unit));

  function show(next: number, nextUnit: string | null) {
    setAmount(next);
    setText(formatAmountForInput(next, nextUnit));
  }

  function step(by: number) {
    show(stepDraftAmount(amount ?? 0, by), unit);
  }

  function pick(next: string) {
    if (next === unit) return;
    setUnit(next);
    if (amount === null || unit === null) return;
    show(convertPantryAmount(item.name, amount, unit, next)?.amount ?? amount, next);
  }

  function type(typed: string) {
    setText(typed);
    setAmount(parseAmountText(typed));
  }

  function save() {
    Keyboard.dismiss();
    if (amount !== null && isValidPantryAmount(item, amount, unit)) onSave(amount, unit);
  }

  const limit = pantryAmountLimit(item, unit);
  const overLimit = amount !== null && !isValidPantryAmount(item, amount, unit) && amount > 0;
  const estimated = choices.find((choice) => choice.unit === unit)?.approximate ?? false;
  const unitText = formatPantryUnit(amount ?? 0, unit);

  return (
    <View>
      <SheetGrabBar label="Close without saving" onPress={onClose} />
      <SheetHeader
        icon="pantry"
        title={formatIngredientName(item.name)}
        subtitle={formatCountedIn(item.unit)}
        badge={formatNowBadge(onHand.amount, onHand.unit, onHand.approximate)}
      />

      <View style={styles.amountRow}>
        {STEPS.slice(0, 2).map((by) => (
          <StepButton key={by} by={by} unit={unit} onPress={() => step(by)} />
        ))}
        <View style={styles.fieldColumn}>
          <TextInput
            accessibilityLabel="Amount"
            keyboardType="decimal-pad"
            returnKeyType="done"
            onSubmitEditing={() => Keyboard.dismiss()}
            selectTextOnFocus
            onChangeText={type}
            value={text}
            style={styles.field}
          />
          {unitText ? <Text style={styles.fieldUnit}>{unitText}</Text> : null}
        </View>
        {STEPS.slice(2).map((by) => (
          <StepButton key={by} by={by} unit={unit} onPress={() => step(by)} />
        ))}
      </View>
      {overLimit ? <Text style={styles.limit}>{formatAmountLimit(limit, unit)}</Text> : null}

      {choices.length > 1 ? (
        <>
          <View style={styles.unitLabel}>
            <SheetSectionLabel text="Unit" />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.chips}
          >
            {choices.map((choice) => (
              <UnitChip
                key={choice.unit}
                label={formatUnitChoice(choice.unit)}
                selected={choice.unit === unit}
                onPress={() => pick(choice.unit)}
              />
            ))}
          </ScrollView>
          {estimated ? <Text style={styles.note}>{ESTIMATE_NOTE}</Text> : null}
        </>
      ) : null}

      <View style={styles.footer}>
        <SheetFooterButton label="Save" onPress={save} disabled={amount === null || !isValidPantryAmount(item, amount, unit)} />
      </View>
    </View>
  );
}

function StepButton({ by, unit, onPress }: { by: number; unit: string | null; onPress: () => void }) {
  const big = Math.abs(by) === 5;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={formatSheetStepLabel(by, unit)}
      onPress={onPress}
      // Android fades the button as one picture, not its fill, border and label separately (see AGENTS.md §5.2).
      needsOffscreenAlphaCompositing
      style={({ pressed }) => [styles.step, big ? styles.stepBig : styles.stepSmall, pressed && styles.stepPressed]}
    >
      <Text style={styles.stepText}>{by < 0 ? `−${-by}` : `+${by}`}</Text>
    </Pressable>
  );
}

/** The board's 48 px step buttons and 56 px number field. */
const STEP_SIZE = 48;
const FIELD_HEIGHT = 56;

const styles = StyleSheet.create({
  amountRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, paddingHorizontal: spacing.screen },
  step: {
    width: STEP_SIZE,
    height: STEP_SIZE,
    marginTop: spacing.xs,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
  },
  stepBig: { backgroundColor: colors.blueSoft, borderColor: colors.blueBorder },
  stepSmall: { backgroundColor: colors.surface, borderColor: colors.border },
  stepPressed: { opacity: 0.7 },
  stepText: { fontFamily: fonts.heavy, fontSize: fontSize.input, color: colors.blue },
  fieldColumn: { flex: 1, minWidth: 0, alignItems: 'center', gap: spacing.xs },
  field: {
    alignSelf: 'stretch',
    height: FIELD_HEIGHT,
    paddingHorizontal: 6,
    paddingVertical: 0,
    textAlign: 'center',
    fontFamily: fonts.heading,
    fontSize: fontSize.amountInput,
    color: colors.text,
    backgroundColor: colors.blueWash,
    borderWidth: 1.5,
    borderColor: colors.blue,
    borderRadius: radii.lg,
  },
  fieldUnit: { fontFamily: fonts.heavy, fontSize: fontSize.caption, color: colors.blue, letterSpacing: 0.25 },
  limit: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.screen,
    textAlign: 'center',
    fontFamily: fonts.semibold,
    fontSize: fontSize.meta,
    color: colors.accent,
  },
  unitLabel: { paddingTop: spacing.lg, paddingHorizontal: spacing.screen, paddingBottom: spacing.sm },
  chips: { gap: spacing.sm, paddingVertical: 2, paddingHorizontal: spacing.screen },
  note: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.screen,
    fontFamily: fonts.regular,
    fontSize: fontSize.meta,
    color: colors.textSecondary,
  },
  footer: { marginTop: spacing.xl },
});
