// PRESENTATION LAYER: one ingredient in the pantry list, with the mockup's quantity stepper (− count +).
// At a count of 1 the − button becomes a remove button (× icon). The mockup's category dot and category
// label are left out: no data backs them. The rules (the maximum, when − removes) come in as props.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatIngredientName } from '../format/pantryInfo';
import { colors, fonts, fontSize, radii, spacing } from '../theme';
import { Icon, type IconName } from './Icon';

type Props = {
  name: string;
  quantity: number;
  /** False at the maximum: the + button is disabled. */
  canIncrease: boolean;
  /** True when pressing − takes the ingredient out of the pantry. */
  decreaseRemoves: boolean;
  onIncrease: () => void;
  onDecrease: () => void;
};

export function PantryItemRow({ name, quantity, canIncrease, decreaseRemoves, onIncrease, onDecrease }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.name}>{formatIngredientName(name)}</Text>
      <View style={styles.stepper}>
        {/* The outlined pill is drawn behind the buttons, not around them: Android only delivers a tap
            to a child inside its parent's bounds, and each button needs a 44px square. */}
        <View testID="quantity-pill" pointerEvents="none" style={styles.pill} />
        <StepButton
          label={decreaseRemoves ? `Remove ${name}` : `Decrease ${name} quantity`}
          icon={decreaseRemoves ? 'close' : 'minus'}
          onPress={onDecrease}
        />
        <Text style={styles.quantity}>{String(quantity)}</Text>
        <StepButton label={`Increase ${name} quantity`} icon="plus" onPress={onIncrease} disabled={!canIncrease} />
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
        <View style={[styles.circle, pressed && styles.circlePressed, disabled && styles.circleDisabled]}>
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
  circleDisabled: { opacity: 0.35 },
  // 36px keeps the circles as far apart as the board's 50px count box, and stops the pill from
  // changing width between 9 and 10.
  quantity: {
    minWidth: 36,
    textAlign: 'center',
    fontSize: fontSize.input,
    fontFamily: fonts.heavy,
    color: colors.text,
  },
});
