// PRESENTATION LAYER: a sheet that slides up over the screen, as the board's amount sheet does: a dimmed backdrop
// over the whole screen, and the sheet itself standing on the screen's bottom edge, with its top corners rounded.
// It says when it covers the dock's spot (onCoversDockChange) as it moves, so the screen can have the tab bar
// move out of its way, and come back once the sheet has slid down below it. It leaves room under its
// content for the home indicator or navigation bar. It slides in and out over TRAY_SLIDE_MS (it jumps with Reduce
// Motion on), rises to sit on the on-screen keyboard, and closes on the backdrop and on Android's back button.
// A finger can drag it down by whatever its content puts the drag handlers on (the grab bar and header): it follows
// the finger, and when let go it closes past a third of the way or after a flick (trayDrag's settlesOpen), or else
// springs back. What it shows comes in as a function of those handlers; it keeps showing it while it slides away.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, PanResponder, Pressable, StyleSheet, View, type GestureResponderHandlers } from 'react-native';
import { draggedOffset, settlesOpen, startsTrayDrag, TRAY_SLIDE_MS } from '../motion/trayDrag';
import { useReduceMotion } from '../motion/useReduceMotion';
import { dockHasRoom } from '../platform/dockLayout';
import { liftedSheetBottom, sheetSafeAreaPadding } from '../platform/keyboardLift';
import { useCloseOnBack } from '../platform/useCloseOnBack';
import { useKeyboardOverlap } from '../platform/useKeyboardOverlap';
import { colors, radii, shadows } from '../theme';

type Props = {
  open: boolean;
  /** The safe area's bottom inset: room left under the content, and for working out where the keyboard's top is (see keyboardLift). */
  bottomInset: number;
  /** What screen readers call the backdrop, which closes the sheet ("Close without saving"). */
  closeLabel: string;
  onClose: () => void;
  /** What screen readers call the sheet. */
  label?: string;
  /** The dock's bottom and top edges (platform/dockLayout's dockSpot), for onCoversDockChange. */
  dockSpot?: { bottom: number; top: number };
  /** Called with true when the sheet comes over the dock's spot, and false once it leaves the dock room again. */
  onCoversDockChange?: (covers: boolean) => void;
  /** What the sheet shows, given the handlers to put on the part a finger drags the sheet by. */
  children: (dragHandlers: GestureResponderHandlers) => React.ReactNode;
};

/** How far below its place the sheet starts before its height is measured. */
const UNMEASURED_HEIGHT = 600;
const EASE = Easing.out(Easing.cubic);
/** The spring back after a drag that didn't close the sheet; the tray's, so the two feel alike. */
const SPRING = { damping: 22, stiffness: 220, mass: 1 };

export function BottomSheet({ open, bottomInset, closeLabel, onClose, label, dockSpot, onCoversDockChange, children }: Props) {
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

  /** How far a finger has dragged the sheet down from where it stands (never above it). */
  const dragOffset = useRef(new Animated.Value(0)).current;

  // Says when the sheet comes over the dock's spot and leaves it, as the slide and the drag move it. The keyboard's
  // lift is left out: the keyboard covers the dock's spot anyway.
  const dockWatch = useRef({ dockSpot, onCoversDockChange, height, progress: open ? 1 : 0, drag: 0, hasRoom: true });
  Object.assign(dockWatch.current, { dockSpot, onCoversDockChange, height });
  const checkDockRoom = useRef(() => {
    const watch = dockWatch.current;
    if (!watch.dockSpot) return;
    const sheetBottom = -((1 - watch.progress) * watch.height + watch.drag);
    const hasRoom = dockHasRoom({ sheetBottom, sheetTop: sheetBottom + watch.height, dock: watch.dockSpot, hadRoom: watch.hasRoom });
    if (hasRoom === watch.hasRoom) return;
    watch.hasRoom = hasRoom;
    watch.onCoversDockChange?.(!hasRoom);
  }).current;
  useEffect(() => {
    const progressListener = progress.addListener(({ value }) => {
      dockWatch.current.progress = value;
      checkDockRoom();
    });
    const dragListener = dragOffset.addListener(({ value }) => {
      dockWatch.current.drag = value;
      checkDockRoom();
    });
    checkDockRoom();
    return () => {
      progress.removeListener(progressListener);
      dragOffset.removeListener(dragListener);
    };
  }, [progress, dragOffset, checkDockRoom]);
  // A newly measured height moves the sheet's top edge too.
  useEffect(checkDockRoom, [height, checkDockRoom]);

  // The drag handlers are made once, so they read the latest values through this ref.
  const latest = useRef({ height, onClose });
  latest.current = { height, onClose };
  const dragResponder = useMemo(() => {
    let start = 0;
    const currentOffset = () => {
      let value = 0;
      dragOffset.stopAnimation((stoppedAt) => {
        value = stoppedAt;
      });
      return value;
    };
    const release = (velocity: number) => {
      const { height: closedOffset, onClose: close } = latest.current;
      if (!settlesOpen({ startedOpen: true, offset: currentOffset(), velocity, closedOffset })) {
        close();
        return;
      }
      if (latestReduceMotion.current) dragOffset.setValue(0);
      else Animated.spring(dragOffset, { toValue: 0, velocity: velocity * 1000, ...SPRING, useNativeDriver: false }).start();
    };
    return PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, g) => startsTrayDrag(g.dx, g.dy),
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        Keyboard.dismiss();
        start = currentOffset();
      },
      onPanResponderMove: (_, g) => dragOffset.setValue(Math.max(0, draggedOffset(start, g.dy, latest.current.height))),
      onPanResponderRelease: (_, g) => release(g.vy),
      onPanResponderTerminate: (_, g) => release(g.vy),
    });
  }, [dragOffset]);

  // The content to show while the sheet slides away, when the screen may already have dropped it.
  const lastChildren = useRef(children);
  if (open) lastChildren.current = children;

  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (open) {
      setShown(true);
      dragOffset.setValue(0);
    }
    const arrive = ({ finished }: { finished: boolean }) => {
      if (!finished || open) return;
      setShown(false);
      dragOffset.setValue(0);
    };
    progress.stopAnimation();
    if (latestReduceMotion.current) {
      progress.setValue(open ? 1 : 0);
      arrive({ finished: true });
      return;
    }
    Animated.timing(progress, { toValue: open ? 1 : 0, duration: TRAY_SLIDE_MS, easing: EASE, useNativeDriver: false }).start(arrive);
  }, [open, progress, dragOffset]);

  // Rises with the keyboard (over its own duration on iOS; at once on Android, or with Reduce Motion on).
  const sheetBottom = useRef(new Animated.Value(0)).current;
  const target = liftedSheetBottom({ restingBottom: 0, overlap: keyboard.overlap });
  useEffect(() => {
    sheetBottom.stopAnimation();
    if (keyboard.duration <= 0 || latestReduceMotion.current) sheetBottom.setValue(target);
    else Animated.timing(sheetBottom, { toValue: target, duration: keyboard.duration, easing: EASE, useNativeDriver: false }).start();
  }, [target, keyboard.duration, sheetBottom]);

  if (!shown) return null;
  // A sheet closed by a drag slides on from where the finger left it.
  const translateY = Animated.add(progress.interpolate({ inputRange: [0, 1], outputRange: [height, 0] }), dragOffset);
  const backdropOpacity = Animated.multiply(
    progress,
    dragOffset.interpolate({ inputRange: [0, Math.max(1, height)], outputRange: [1, 0], extrapolate: 'clamp' }),
  );
  const paddingBottom = sheetSafeAreaPadding({ bottomInset, overlap: keyboard.overlap });
  return (
    <View style={styles.area} pointerEvents="box-none">
      <Animated.View testID="bottom-sheet-backdrop" style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={closeLabel} onPress={onClose} style={styles.fill} />
      </Animated.View>
      <Animated.View
        testID="bottom-sheet"
        accessibilityLabel={label}
        onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
        style={[styles.sheet, { bottom: sheetBottom, paddingBottom, transform: [{ translateY }] }]}
      >
        {lastChildren.current(dragResponder.panHandlers)}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // The whole screen, so the sheet can be placed by its distance from the bottom; touches pass through.
  area: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: colors.scrim },
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
