// PRESENTATION LAYER: a sheet that slides up over the screen, as the board's amount sheet does: a dimmed backdrop
// from the top down to the sheet's bottom edge (so the tab bar below stays uncovered), and the sheet itself, with
// its top corners rounded. It slides in and out over TRAY_SLIDE_MS (it jumps with Reduce Motion on), rises above
// the on-screen keyboard, and closes on the backdrop and on Android's back button. What it shows comes in as
// children; it keeps showing them while it slides away.
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { TRAY_SLIDE_MS } from '../motion/trayDrag';
import { useReduceMotion } from '../motion/useReduceMotion';
import { liftedSheetBottom } from '../platform/keyboardLift';
import { useCloseOnBack } from '../platform/useCloseOnBack';
import { useKeyboardOverlap } from '../platform/useKeyboardOverlap';
import { colors, radii, shadows } from '../theme';

type Props = {
  open: boolean;
  /** Distance from the screen's bottom edge to the sheet's bottom edge while the keyboard is hidden. */
  bottom: number;
  /** The safe area's bottom inset, for working out where the keyboard's top is (see keyboardLift). */
  bottomInset: number;
  /** What screen readers call the backdrop, which closes the sheet ("Close without saving"). */
  closeLabel: string;
  onClose: () => void;
  /** What screen readers call the sheet. */
  label?: string;
  children: React.ReactNode;
};

/** How far below its place the sheet starts before its height is measured. */
const UNMEASURED_HEIGHT = 600;
const EASE = Easing.out(Easing.cubic);

export function BottomSheet({ open, bottom, bottomInset, closeLabel, onClose, label, children }: Props) {
  const reduceMotion = useReduceMotion();
  useCloseOnBack(open, onClose);
  const keyboard = useKeyboardOverlap(bottomInset);

  /** Whether the sheet is drawn: while open, and while it slides away. */
  const [shown, setShown] = useState(open);
  const [height, setHeight] = useState(UNMEASURED_HEIGHT);
  /** 1 when open, 0 when closed; the slide and the backdrop's fade follow it. */
  const progress = useRef(new Animated.Value(open ? 1 : 0)).current;
  const latestReduceMotion = useRef(reduceMotion);
  latestReduceMotion.current = reduceMotion;

  // The content to show while the sheet slides away, when the screen may already have dropped it.
  const lastChildren = useRef(children);
  if (open) lastChildren.current = children;

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (open) setShown(true);
    const arrive = ({ finished }: { finished: boolean }) => {
      if (finished && !open) setShown(false);
    };
    progress.stopAnimation();
    if (latestReduceMotion.current) {
      progress.setValue(open ? 1 : 0);
      arrive({ finished: true });
      return;
    }
    Animated.timing(progress, { toValue: open ? 1 : 0, duration: TRAY_SLIDE_MS, easing: EASE, useNativeDriver: false }).start(arrive);
  }, [open, progress]);

  // Rises with the keyboard (over its own duration on iOS; at once on Android, or with Reduce Motion on).
  const sheetBottom = useRef(new Animated.Value(bottom)).current;
  const target = liftedSheetBottom({ restingBottom: bottom, overlap: keyboard.overlap });
  useEffect(() => {
    sheetBottom.stopAnimation();
    if (keyboard.duration <= 0 || latestReduceMotion.current) sheetBottom.setValue(target);
    else Animated.timing(sheetBottom, { toValue: target, duration: keyboard.duration, easing: EASE, useNativeDriver: false }).start();
  }, [target, keyboard.duration, sheetBottom]);

  if (!shown) return null;
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [height + bottom, 0] });
  return (
    <View style={styles.area} pointerEvents="box-none">
      <Animated.View testID="bottom-sheet-backdrop" style={[styles.backdrop, { bottom, opacity: progress }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={closeLabel} onPress={onClose} style={styles.fill} />
      </Animated.View>
      <Animated.View
        testID="bottom-sheet"
        accessibilityLabel={label}
        onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
        style={[styles.sheet, { bottom: sheetBottom, transform: [{ translateY }] }]}
      >
        {lastChildren.current}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // The whole screen, so the sheet can be placed by its distance from the bottom; touches pass through.
  area: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: colors.scrim },
  fill: { flex: 1 },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.border,
    borderTopLeftRadius: radii.sheet,
    borderTopRightRadius: radii.sheet,
    ...shadows.sheet,
  },
});
