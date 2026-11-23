// PRESENTATION LAYER: the board's on/off switch (the Filters sheet's Meal Prep). It's drawn here instead of using
// React Native's own Switch, which looks different on iOS and Android (the two platforms are meant to match). The
// knob slides across; with Reduce Motion on it jumps. The touch area is 44 px tall around the 32 px switch.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { useReduceMotion } from '../motion/useReduceMotion';
import { colors } from '../theme';

type Props = {
  /** What screen readers call the switch ("Meal Prep"). */
  label: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

const KNOB_OFF = 3;
const KNOB_ON = 23;
const SLIDE_MS = 150;

export function ToggleSwitch({ label, value, onValueChange }: Props) {
  const reduceMotion = useReduceMotion();
  const knobLeft = useRef(new Animated.Value(value ? KNOB_ON : KNOB_OFF)).current;
  const latestReduceMotion = useRef(reduceMotion);
  latestReduceMotion.current = reduceMotion;

  useEffect(() => {
    const target = value ? KNOB_ON : KNOB_OFF;
    knobLeft.stopAnimation();
    if (latestReduceMotion.current) knobLeft.setValue(target);
    else Animated.timing(knobLeft, { toValue: target, duration: SLIDE_MS, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [value, knobLeft]);

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      style={styles.touchArea}
    >
      <View testID="toggle-track" style={[styles.track, { backgroundColor: value ? colors.blue : colors.border }]}>
        <Animated.View testID="toggle-thumb" style={[styles.knob, { left: knobLeft }]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  touchArea: { width: 56, height: 44, alignItems: 'center', justifyContent: 'center' },
  track: { width: 52, height: 32, borderRadius: 999 },
  knob: {
    position: 'absolute',
    top: 3,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.surface,
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 1.5,
    elevation: 2,
  },
});
