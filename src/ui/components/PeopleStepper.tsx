// PRESENTATION LAYER: the Filters sheet's "Number of people" control: a pill with − and + around the current choice.
// It runs Any, 1 person, 2 people … up to the board's 12, so the filter can be switched off again.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatPeople } from '../format/recipeFilters';
import { colors, fonts, fontSize } from '../theme';
import { PressableScale } from './PressableScale';

/** The most people the stepper goes to, as on the board. */
export const MAX_PEOPLE = 12;

type Props = {
  /** The chosen number, or undefined for Any. */
  value: number | undefined;
  onChange: (people: number | undefined) => void;
};

export function PeopleStepper({ value, onChange }: Props) {
  const canGoDown = value !== undefined;
  const canGoUp = value === undefined || value < MAX_PEOPLE;
  return (
    <View style={styles.pill}>
      <StepButton
        label="Fewer people"
        symbol="−"
        disabled={!canGoDown}
        onPress={() => onChange(value === undefined || value <= 1 ? undefined : value - 1)}
      />
      <Text style={styles.value}>{formatPeople(value)}</Text>
      <StepButton label="More people" symbol="+" disabled={!canGoUp} onPress={() => onChange(value === undefined ? 1 : value + 1)} />
    </View>
  );
}

function StepButton({ label, symbol, disabled, onPress }: { label: string; symbol: string; disabled: boolean; onPress: () => void }) {
  return (
    <PressableScale
      size="small"
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.step, disabled && styles.stepDisabled]}
    >
      <Text style={styles.stepSymbol}>{symbol}</Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    backgroundColor: colors.surface,
  },
  value: { minWidth: 76, textAlign: 'center', fontFamily: fonts.heavy, fontSize: fontSize.input, color: colors.text },
  step: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 20 },
  stepDisabled: { opacity: 0.35 },
  stepSymbol: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 26, color: colors.blue },
});
