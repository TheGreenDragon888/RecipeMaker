// PRESENTATION LAYER: a Pressable that shrinks a little while a finger is on it and springs back when it lifts,
// so every button, card and chip answers a touch at once. It takes Pressable's props, plus `size` (how far it
// shrinks; see motion/pressFeedback). The scale is on a wrapper around the Pressable, so `wrapperStyle` takes
// any layout the Pressable used to have toward its parent (flex, margins, alignSelf). With Reduce Motion on it
// doesn't shrink; the pressed colors in `style` still show.
import React, { useRef } from 'react';
import { Animated, Pressable, type GestureResponderEvent, type PressableProps, type StyleProp, type ViewStyle } from 'react-native';
import { pressedScale, type PressSize } from '../motion/pressFeedback';
import { useReduceMotion } from '../motion/useReduceMotion';

type Props = PressableProps & {
  size: PressSize;
  /** Layout toward the parent (flex, margins, alignSelf), for the wrapper that scales. */
  wrapperStyle?: StyleProp<ViewStyle>;
};

/** Down quickly with no bounce; back up with a slight one. */
const PRESS_SPRING = { speed: 50, bounciness: 0 };
const RELEASE_SPRING = { speed: 20, bounciness: 8 };

export function PressableScale({ size, wrapperStyle, onPressIn, onPressOut, ...pressable }: Props) {
  const reduceMotion = useReduceMotion();
  const scale = useRef(new Animated.Value(1)).current;
  const springTo = (toValue: number, spring: typeof PRESS_SPRING) => {
    scale.stopAnimation();
    // The JS driver: Jest's stand-in for the native driver never moves the value (see DockBar).
    Animated.spring(scale, { toValue, ...spring, useNativeDriver: false }).start();
  };
  const handlePressIn = (event: GestureResponderEvent) => {
    springTo(pressedScale(size, reduceMotion), PRESS_SPRING);
    onPressIn?.(event);
  };
  const handlePressOut = (event: GestureResponderEvent) => {
    springTo(1, RELEASE_SPRING);
    onPressOut?.(event);
  };
  return (
    <Animated.View style={[wrapperStyle, { transform: [{ scale }] }]}>
      <Pressable {...pressable} onPressIn={handlePressIn} onPressOut={handlePressOut} />
    </Animated.View>
  );
}
