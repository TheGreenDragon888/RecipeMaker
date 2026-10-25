// PRESENTATION LAYER: the seasoning tray's handle and sheet, and how one turns into the other.
// The screen says whether the tray is open; this component moves the sheet there. Closed, the sheet is the
// handle's box above "Find recipes"; open, it is the full sheet above the tab bar. In between, its top edge,
// bottom edge, side margins and corners all blend between the two, and the handle fades out on top of it,
// so the sheet grows out of the handle and shrinks back into it. A tap on the handle, Done, the backdrop or
// the grab bar plays that over TRAY_SLIDE_MS. Dragging the handle up, or the sheet's grab bar and header
// down, moves the top edge with the finger; when let go it springs to where trayDrag's settlesOpen says,
// calling onOpen or onClose if that is a change. With Reduce Motion on, it jumps instead. Android's back
// button closes the open tray.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Pressable, StyleSheet, View } from 'react-native';
import type { SeasoningGroup } from '../../domain/seasonings';
import { draggedOffset, settlesOpen, startsTrayDrag, trayTravel, TRAY_SLIDE_MS } from '../motion/trayDrag';
import { useReduceMotion } from '../motion/useReduceMotion';
import { useCloseOnBack } from '../platform/useCloseOnBack';
import { colors, radii, shadows, spacing } from '../theme';
import { SeasoningTray } from './SeasoningTray';
import { SEASONING_HANDLE_HEIGHT, SeasoningTrayHandle } from './SeasoningTrayHandle';

type Props = {
  groups: SeasoningGroup[];
  /** Names of the seasonings that are on. */
  on: string[];
  /** Distance from the screen's bottom edge to the open sheet's bottom (the tab screen's clearance for its tab bar). */
  bottom: number;
  /** Distance from the screen's bottom edge to the closed handle's bottom. */
  handleBottom: number;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onToggle: (name: string) => void;
};

/** The board's sheet height... */
const BOARD_SHEET_HEIGHT = 520;
/** ...but never more than this share of the screen. */
const MAX_SHEET_SHARE = 0.85;
/** The handle fades out over the sheet's first this-many px of growth. */
const HANDLE_FADE_PX = 80;
/** A settling spring with a small bounce at open. */
const SPRING = { damping: 22, stiffness: 220, mass: 1 };

export function SeasoningDrawer({ groups, on, bottom, handleBottom, open, onOpen, onClose, onToggle }: Props) {
  const [screenHeight, setScreenHeight] = useState<number | null>(null);
  const sheetHeight = screenHeight === null ? BOARD_SHEET_HEIGHT : Math.min(BOARD_SHEET_HEIGHT, screenHeight * MAX_SHEET_SHARE);
  const travel = Math.max(1, trayTravel({ bottom, height: sheetHeight }, { bottom: handleBottom, height: SEASONING_HANDLE_HEIGHT }));

  /** Whether the tray's content is drawn: while open, while moving, and while dragged out of the handle. */
  const [sheetShown, setSheetShown] = useState(open);
  /** Whether the sheet is open and still; only then is the handle gone. */
  const [settledOpen, setSettledOpen] = useState(open);
  const [draggingHandle, setDraggingHandle] = useState(false);
  const reduceMotion = useReduceMotion();
  useCloseOnBack(open, onClose);
  /** How far the top edge sits below open: 0 is open, travel is closed (the sheet is the handle). */
  const offset = useRef(new Animated.Value(open ? 0 : travel)).current;

  // The drag handlers are made once, so they read the latest props and state through this ref.
  const latest = useRef({ open, onOpen, onClose, travel, reduceMotion, sheetShown });
  latest.current = { open, onOpen, onClose, travel, reduceMotion, sheetShown };
  /** The release speed (px/ms) of a drag that asked the screen to open or close, for the spring that follows. */
  const releaseVelocity = useRef<number | undefined>(undefined);

  /** Moves the sheet to open or closed: a spring after a drag (velocity given), else a timed change. */
  function settle(toOpen: boolean, velocity?: number) {
    const toValue = toOpen ? 0 : latest.current.travel;
    const arrive = ({ finished }: { finished: boolean }) => {
      if (!finished) return;
      if (toOpen) setSettledOpen(true);
      else setSheetShown(false);
    };
    offset.stopAnimation();
    if (latest.current.reduceMotion) {
      offset.setValue(toValue);
      arrive({ finished: true });
      return;
    }
    const animation =
      velocity === undefined
        ? Animated.timing(offset, { toValue, duration: TRAY_SLIDE_MS, easing: Easing.out(Easing.cubic), useNativeDriver: false })
        : Animated.spring(offset, { toValue, velocity: velocity * 1000, ...SPRING, useNativeDriver: false });
    animation.start(arrive);
  }

  // When the screen opens or closes the tray, move to match (a spring if a drag asked for it).
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    setSettledOpen(false);
    if (open) setSheetShown(true);
    const velocity = releaseVelocity.current;
    releaseVelocity.current = undefined;
    settle(open, velocity);
    // settle reads everything else through refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // A closed sheet stays the handle's size when the screen's size changes the travel.
  useEffect(() => {
    if (!latest.current.sheetShown) offset.setValue(travel);
  }, [offset, travel]);

  const { trayDrag, handleDrag } = useMemo(() => {
    let start = 0;
    const currentOffset = () => {
      let value = 0;
      offset.stopAnimation((stoppedAt) => {
        value = stoppedAt;
      });
      return value;
    };
    const follow = (dy: number) => offset.setValue(draggedOffset(start, dy, latest.current.travel));
    /** Lets go of a drag: asks the screen to open or close when that changes, else springs back. */
    const release = (startedOpen: boolean, velocity: number) => {
      const toOpen = settlesOpen({ startedOpen, offset: currentOffset(), velocity, closedOffset: latest.current.travel });
      if (toOpen === latest.current.open) {
        settle(toOpen, velocity);
        return;
      }
      releaseVelocity.current = velocity;
      if (toOpen) latest.current.onOpen();
      else latest.current.onClose();
    };
    const shared = {
      onMoveShouldSetPanResponderCapture: (_: unknown, g: { dx: number; dy: number }) => startsTrayDrag(g.dx, g.dy),
      onPanResponderTerminationRequest: () => false,
      onPanResponderMove: (_: unknown, g: { dy: number }) => follow(g.dy),
    };
    return {
      trayDrag: PanResponder.create({
        ...shared,
        onPanResponderGrant: () => {
          start = currentOffset();
          setSettledOpen(false);
        },
        onPanResponderRelease: (_, g) => release(true, g.vy),
        onPanResponderTerminate: (_, g) => release(true, g.vy),
      }),
      handleDrag: PanResponder.create({
        ...shared,
        onPanResponderGrant: () => {
          start = latest.current.travel;
          offset.stopAnimation();
          offset.setValue(start);
          setSheetShown(true);
          setDraggingHandle(true);
        },
        onPanResponderRelease: (_, g) => {
          setDraggingHandle(false);
          release(false, g.vy);
        },
        onPanResponderTerminate: (_, g) => {
          setDraggingHandle(false);
          release(false, g.vy);
        },
      }),
    };
    // Made once: the handlers read props and state through `latest`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offset]);

  // Every changing measurement is a straight line from its open value (offset 0) to its closed value (travel).
  const shape = useMemo(() => {
    const between = (openValue: number, closedValue: number) =>
      offset.interpolate({ inputRange: [0, travel], outputRange: [openValue, closedValue], extrapolate: 'clamp' });
    const frameBottom = between(bottom, handleBottom);
    // The top edge alone keeps moving past open, so a drag above open still stretches the sheet a little.
    const top = offset.interpolate({
      inputRange: [0, travel],
      outputRange: [bottom + sheetHeight, handleBottom + SEASONING_HANDLE_HEIGHT],
      extrapolateLeft: 'extend',
      extrapolateRight: 'clamp',
    });
    const topRadius = between(radii.sheet, radii.xl);
    const bottomRadius = between(0, radii.xl);
    return {
      frame: {
        bottom: frameBottom,
        height: Animated.subtract(top, frameBottom),
        left: between(0, spacing.screen),
        right: between(0, spacing.screen),
      },
      corners: {
        borderTopLeftRadius: topRadius,
        borderTopRightRadius: topRadius,
        borderBottomLeftRadius: bottomRadius,
        borderBottomRightRadius: bottomRadius,
      },
      // The content keeps its open width and position, so the sheet's edges only crop it.
      contentInset: between(0, -spacing.screen),
      backdropOpacity: between(1, 0),
      handleOpacity: offset.interpolate({
        inputRange: [Math.max(0, travel - HANDLE_FADE_PX), travel],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }),
    };
  }, [offset, travel, bottom, handleBottom, sheetHeight]);

  return (
    <View
      testID="seasoning-tray-area"
      pointerEvents="box-none"
      style={styles.area}
      onLayout={(event) => setScreenHeight(event.nativeEvent.layout.height)}
    >
      {sheetShown ? (
        <Animated.View testID="seasoning-backdrop" style={[styles.backdrop, { bottom, opacity: shape.backdropOpacity }]}>
          <Pressable
            testID="seasoning-backdrop-button"
            accessibilityRole="button"
            accessibilityLabel="Close seasonings tray"
            onPress={onClose}
            style={styles.fill}
          />
        </Animated.View>
      ) : null}

      <Animated.View testID="seasoning-sheet" accessibilityLabel="Seasonings" style={[styles.frame, shape.frame, shape.corners]}>
        <Animated.View style={[styles.clip, shape.corners]}>
          {sheetShown ? (
            <Animated.View
              testID="seasoning-sheet-content"
              style={[styles.content, { height: sheetHeight, left: shape.contentInset, right: shape.contentInset }]}
            >
              <SeasoningTray groups={groups} on={on} onToggle={onToggle} onClose={onClose} dragHandlers={trayDrag.panHandlers} />
            </Animated.View>
          ) : null}
          {!settledOpen ? (
            <Animated.View
              testID="seasoning-handle-drag-area"
              pointerEvents={!sheetShown || draggingHandle ? 'auto' : 'none'}
              style={[styles.handle, { opacity: shape.handleOpacity }]}
              {...handleDrag.panHandlers}
            >
              <SeasoningTrayHandle onCount={on.length} onOpen={onOpen} fill />
            </Animated.View>
          ) : null}
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  // The whole screen, so the sheet can be placed by its distance from the bottom; touches pass through.
  area: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  // Dims everything above the dock (its bottom is set in the JSX).
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, backgroundColor: colors.scrim },
  fill: { flex: 1 },
  // The sheet's box; its edges, size and corners are set in the JSX. The shadow sits outside the clip.
  frame: {
    position: 'absolute',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sheet,
  },
  clip: { flex: 1, overflow: 'hidden' },
  content: { position: 'absolute', top: 0 },
  // The handle covers the whole sheet, on top of the content, until the sheet is open; as it fades, nothing
  // under it shows through.
  handle: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
});
