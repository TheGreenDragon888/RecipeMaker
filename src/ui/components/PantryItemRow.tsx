// PRESENTATION LAYER: one ingredient in the pantry list, with the mockup's quantity stepper (− amount unit +),
// e.g. "− 2 cloves +"; the unit is left off when it isn't known. The amount is rounded for its unit ("2.06 cups",
// "473 mL"), with "≈" when it is an estimate. Tapping the amount opens the amount sheet (onEditAmount).
// When one step leaves nothing, the − button becomes a remove button (× icon). The mockup's category dot and
// category label are left out: no data backs them. The rules (the maximum, when − removes) come in as props.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatEditAmountLabel, formatPantryAmount, formatQuantityStepLabel } from '../format/pantryAmount';
import { formatIngredientName, formatPantryUnit } from '../format/pantryInfo';
import { colors, fonts, fontSize, radii, spacing } from '../theme';
import { Icon, type IconName } from './Icon';

type Props = {
  name: string;
  /** The amount shown, in `unit`. */
  quantity: number;
  /** The unit shown, singular ("clove"), after the amount; null shows the amount alone. */
  unit?: string | null;
  /** True when the amount is converted with a typical size or density: it shows "≈". */
  approximate?: boolean;
  /** The unit one − / + step counts in, when it isn't the one shown (an item shown in mL steps in cups). */
  stepUnit?: string | null;
  /** False at the maximum: the + button is disabled. */
  canIncrease: boolean;
  /** True when pressing − takes the ingredient out of the pantry. */
  decreaseRemoves: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
  /** Opens the amount sheet; without it the amount is plain text. */
  onEditAmount?: () => void;
  /** Whether the sheet offers other units, for the amount button's label. */
  hasOtherUnits?: boolean;
};

export function PantryItemRow({
  name,
  quantity,
  unit = null,
  approximate = false,
  stepUnit = null,
  canIncrease,
  decreaseRemoves,
  onIncrease,
  onDecrease,
  onEditAmount,
  hasOtherUnits = false,
}: Props) {
  const unitText = formatPantryUnit(quantity, unit);
  const amountText = formatPantryAmount(quantity, unit, approximate);
  const amount = (
    <Text style={styles.quantity}>
      {amountText}
      {unitText ? ' ' : null}
      {unitText ? <Text style={styles.unit}>{unitText}</Text> : null}
    </Text>
  );
  return (
    <View style={styles.row}>
      <Text style={styles.name}>{formatIngredientName(name)}</Text>
      <View style={styles.stepper}>
        {/* The outlined pill is drawn behind the buttons, not around them: Android only delivers a tap
            to a child inside its parent's bounds, and each button needs a 44px square. */}
        <View testID="quantity-pill" pointerEvents="none" style={styles.pill} />
        <StepButton
          label={decreaseRemoves ? `Remove ${name}` : formatQuantityStepLabel('decrease', name, stepUnit)}
          icon={decreaseRemoves ? 'close' : 'minus'}
          onPress={onDecrease}
        />
        {onEditAmount ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={formatEditAmountLabel(name, hasOtherUnits)}
            accessibilityValue={{ text: unitText ? `${amountText} ${unitText}` : amountText }}
            onPress={onEditAmount}
            style={styles.amountTouch}
          >
            {({ pressed }) => <View style={[styles.amountFace, pressed && styles.circlePressed]}>{amount}</View>}
          </Pressable>
        ) : (
          amount
        )}
        <StepButton
          label={formatQuantityStepLabel('increase', name, stepUnit)}
          icon="plus"
          onPress={onIncrease}
          disabled={!canIncrease}
        />
      </View>
    </View>
  );
}

type StepButtonProps = { label: string; icon: IconName; onPress: () => void; disabled?: boolean };

function StepButton({ label, icon, onPress, disabled = false }: StepButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={styles.touch}
    >
      {({ pressed }) => (
        // Android fades the circle as one picture, not its fill and icon separately (see AGENTS.md §5.2).
        <View
          needsOffscreenAlphaCompositing
          style={[styles.circle, pressed && styles.circlePressed, disabled && styles.circleDisabled]}
        >
          <Icon name={icon} size={14} color={colors.accent} strokeWidth={2.5} />
        </View>
      )}
    </Pressable>
  );
}

const TOUCH_SIZE = 44;
const CIRCLE_SIZE = 26;
/** The pill sits this far inside the stepper, so it hugs the circles with the board's 1px border + 3px padding. */
const PILL_INSET = (TOUCH_SIZE - CIRCLE_SIZE) / 2 - 4;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 13,
    paddingHorizontal: spacing.xxs,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  name: { flex: 1, fontSize: fontSize.emphasis, fontFamily: fonts.bold, color: colors.text },
  // Negative margins let the 44px buttons reach into the row's padding and the gap, so the row keeps
  // the height and spacing the 34px pill gives it. On the right it stops at the row's edge, where taps end.
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: -PILL_INSET,
    marginLeft: -PILL_INSET,
    marginRight: -spacing.xxs,
  },
  pill: {
    position: 'absolute',
    top: PILL_INSET,
    bottom: PILL_INSET,
    left: PILL_INSET,
    right: PILL_INSET,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  touch: { width: TOUCH_SIZE, height: TOUCH_SIZE, alignItems: 'center', justifyContent: 'center' },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circlePressed: { backgroundColor: colors.pressed },
  // The amount button is 44px tall like the step buttons, so it stays inside the stepper's bounds (see above);
  // its pressed look is the board's 26px pill around the amount.
  amountTouch: { height: TOUCH_SIZE, justifyContent: 'center' },
  amountFace: { height: CIRCLE_SIZE, justifyContent: 'center', borderRadius: radii.pill },
  circleDisabled: { opacity: 0.35 },
  // The board's 50px count box: room for "2 cups", and the pill doesn't change width between 9 and 10.
  quantity: {
    minWidth: 50,
    paddingHorizontal: spacing.xs,
    textAlign: 'center',
    fontSize: fontSize.input,
    fontFamily: fonts.heavy,
    color: colors.text,
  },
  unit: { fontSize: fontSize.caption, fontFamily: fonts.semibold, color: colors.textSecondary },
});
