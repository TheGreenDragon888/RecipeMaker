// PRESENTATION LAYER: the floating bottom dock from the board, a rounded pill that holds the tab buttons.
// Its background depends on the device (see platform/dockSurface): a blur, or a see-through fill.
// One accent-tinted pill sits behind the current tab. Each DockItem tells the dock, through DockSlotContext,
// whether it is selected, so the dock knows where to put the pill without being told by the tab navigator.
// A finger can also slide along the dock: a tap stays with the tab under it, but once the finger moves
// sideways (dockSwipe's startsDockSwipe) the dock takes the touch, the pill follows the finger to the tab
// that letting go would open, and letting go presses that tab. Past either end the end tab stays picked, and a
// disabled tab gives way to the nearest one that works; sliding well above or below the dock cancels.
// While a sheet is open (`hidden`), the dock slides down off the screen so the sheet can take its place, and
// takes no touches; screen readers skip it. It slides over the sheets' TRAY_SLIDE_MS, or jumps with Reduce Motion on.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { dockSlotAt, indicatorOffset, startsDockSwipe, swipeTarget } from '../motion/dockSwipe';
import { TRAY_SLIDE_MS } from '../motion/trayDrag';
import { useReduceMotion } from '../motion/useReduceMotion';
import { dockHiddenDrop } from '../platform/dockLayout';
import type { DockSurface } from '../platform/dockSurface';
import { colors, dock, radii, shadows } from '../theme';

type Props = {
  surface: DockSurface;
  /** Distance from the bottom of the screen, from platform/dockLayout (above the home indicator). */
  bottom: number;
  /** For the Android blur: the view holding the screens, which the dock blurs. It must not contain the dock. */
  blurTarget?: React.RefObject<React.ComponentRef<typeof View> | null>;
  /** True while a sheet is open: the dock moves off the bottom of the screen. */
  hidden?: boolean;
  children: React.ReactNode;
};

/** Strength of the blur, 1 to 100; the board blurs 14 px. */
const BLUR_INTENSITY = 50;
/** A quick spring with a slight overshoot, so the pill feels pushed rather than placed. */
const PILL_SPRING = { damping: 20, stiffness: 260, mass: 1 };

/** What a tab in the dock tells the dock about itself. */
export type DockItemReport = { isFocused: boolean; disabled: boolean; onPress?: () => void };
type DockSlot = { index: number; report: (index: number, item: DockItemReport) => void };
const DockSlotContext = createContext<DockSlot | null>(null);
/** The tab the pill is on (during a swipe, the one letting go would open); null before the dock knows. */
const DockPillContext = createContext<number | null>(null);

/**
 * Called by a tab in the dock on every change, so the dock knows which tab is selected. Returns whether the tab
 * should look selected: the one the pill is on. Outside a dock it reports nothing and returns `isFocused`.
 */
export function useReportToDock({ isFocused, disabled, onPress }: DockItemReport): boolean {
  const slot = useContext(DockSlotContext);
  const pill = useContext(DockPillContext);
  useEffect(() => {
    slot?.report(slot.index, { isFocused, disabled, onPress });
  }, [slot, isFocused, disabled, onPress]);
  return slot === null || pill === null ? isFocused : pill === slot.index;
}

export function DockBar({ surface, bottom, blurTarget, hidden = false, children }: Props) {
  const items = useRef<DockItemReport[]>([]);
  const [focused, setFocused] = useState<number | null>(null);
  const report = useCallback((index: number, item: DockItemReport) => {
    items.current[index] = item;
    setFocused((current) => (item.isFocused ? index : current === index ? null : current));
  }, []);
  // One context value per position, kept across renders so a tab reports again only when it changes.
  const slots = useRef<DockSlot[]>([]);
  const slotAt = (index: number) => (slots.current[index] ??= { index, report });

  const tabs = React.Children.toArray(children);

  /** During a swipe, the tab letting go would open (null for none); undefined when no swipe is going on. */
  const [swipingTo, setSwipingTo] = useState<number | null | undefined>(undefined);
  /**
   * The tab a swipe just opened, until the navigator says which tab is open. Its screen can take a moment to
   * load, and the pill stays on it meanwhile instead of drifting back to the tab that was open.
   */
  const [opening, setOpening] = useState<number | null>(null);
  useEffect(() => setOpening(null), [focused]);
  const pillAt = swipingTo ?? opening ?? focused;

  // Where the dock's row is on screen, so a finger's place on screen can be turned into a tab.
  const row = useRef<React.ComponentRef<typeof View>>(null);
  const rowAt = useRef<{ x: number; y: number } | null>(null);
  const measureRow = () =>
    row.current?.measureInWindow((x, y) => {
      rowAt.current = { x, y };
    });

  // The swipe handlers are made once, so they read the latest values through this ref.
  const latest = useRef({ count: tabs.length, focused, measureRow });
  latest.current = { count: tabs.length, focused, measureRow };
  const swipe = useMemo(() => {
    /** Whether the finger has slid sideways far enough to be swiping, not tapping. */
    let swiping = false;
    /** Set when the dock took the touch because the finger slid sideways off a tab. */
    let tookSlidingTouch = false;
    let target: number | null = null;
    const follow = (pageX: number, pageY: number) => {
      const at = rowAt.current;
      if (!at) return;
      target = swipeTarget(dockSlotAt(pageX - at.x, pageY - at.y, latest.current.count), items.current);
      setSwipingTo(target);
    };
    const end = () => {
      swiping = false;
      target = null;
      setSwipingTo(undefined);
    };
    return PanResponder.create({
      // Asked only when no tab took the touch: on the disabled tab, or the dock's edge.
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponderCapture: (_, g) => {
        tookSlidingTouch = startsDockSwipe(g.dx, g.dy);
        return tookSlidingTouch;
      },
      onPanResponderGrant: (_, g) => {
        swiping = tookSlidingTouch;
        tookSlidingTouch = false;
        target = null;
        latest.current.measureRow();
        if (swiping) follow(g.x0, g.y0);
      },
      onPanResponderMove: (_, g) => {
        if (!swiping && !startsDockSwipe(g.dx, g.dy)) return;
        swiping = true;
        follow(g.moveX, g.moveY);
      },
      onPanResponderTerminationRequest: () => !swiping,
      onPanResponderRelease: () => {
        const chosen = swiping ? target : null;
        end();
        if (chosen === null || chosen === latest.current.focused) return;
        setOpening(chosen);
        items.current[chosen]?.onPress?.();
      },
      onPanResponderTerminate: end,
    });
  }, []);

  const reduceMotion = useReduceMotion();
  const pillX = useRef(new Animated.Value(0)).current;
  /** Whether the pill has a place yet; the first place is set, not slid to. */
  const placed = useRef(false);
  useEffect(() => {
    if (pillAt === null) return;
    const toValue = indicatorOffset(pillAt);
    if (!placed.current || reduceMotion) {
      placed.current = true;
      pillX.stopAnimation();
      pillX.setValue(toValue);
      return;
    }
    // The JS driver, as in SeasoningDrawer: Jest's stand-in for the native driver never moves the value, so
    // a native-driven pill couldn't be tested.
    Animated.spring(pillX, { toValue, ...PILL_SPRING, useNativeDriver: false }).start();
  }, [pillAt, pillX, reduceMotion]);

  // Moves down off the screen while hidden. The JS driver, for the same reason as the pill.
  const drop = useRef(new Animated.Value(hidden ? dockHiddenDrop(bottom) : 0)).current;
  const dropFirstRender = useRef(true);
  useEffect(() => {
    const toValue = hidden ? dockHiddenDrop(bottom) : 0;
    drop.stopAnimation();
    if (dropFirstRender.current || reduceMotion) {
      dropFirstRender.current = false;
      drop.setValue(toValue);
      return;
    }
    Animated.timing(drop, { toValue, duration: TRAY_SLIDE_MS, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [hidden, bottom, drop, reduceMotion]);

  const content = (
    <View ref={row} testID="dock-row" style={styles.row} onLayout={measureRow} {...swipe.panHandlers}>
      {pillAt !== null && (
        <Animated.View
          testID="dock-indicator"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.indicator, { transform: [{ translateX: pillX }] }]}
        />
      )}
      <DockPillContext.Provider value={pillAt}>
        {tabs.map((child, index) => (
          <DockSlotContext.Provider key={index} value={slotAt(index)}>
            {child}
          </DockSlotContext.Provider>
        ))}
      </DockPillContext.Provider>
    </View>
  );
  return (
    <Animated.View
      accessibilityRole="tablist"
      pointerEvents={hidden ? 'none' : 'box-none'}
      accessibilityElementsHidden={hidden}
      importantForAccessibility={hidden ? 'no-hide-descendants' : 'auto'}
      style={[styles.floating, { bottom, transform: [{ translateY: drop }] }, surface === 'translucent' && styles.translucent]}
    >
      {surface === 'blur' ? (
        <BlurView tint="light" intensity={BLUR_INTENSITY} style={[styles.pill, styles.outlined]}>
          {content}
        </BlurView>
      ) : surface === 'androidBlur' ? (
        <BlurView
          tint="light"
          intensity={BLUR_INTENSITY}
          blurMethod="dimezisBlurViewSdk31Plus"
          blurTarget={blurTarget}
          style={[styles.pill, styles.outlined]}
        >
          {content}
        </BlurView>
      ) : (
        <View style={[styles.pill, styles.outlined]}>{content}</View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  floating: {
    position: 'absolute',
    alignSelf: 'center',
    borderRadius: radii.dock,
    ...shadows.dock,
  },
  translucent: { backgroundColor: colors.dockSurface },
  pill: {
    borderRadius: radii.dock,
    // A blur only takes the rounded corners when it clips its content.
    overflow: 'hidden',
  },
  outlined: { borderWidth: 0.5, borderColor: colors.dockBorder },
  /** The tabs in a row, inside the dock's padding; the part that follows a finger. */
  row: { flexDirection: 'row', padding: dock.padding },
  indicator: {
    position: 'absolute',
    left: dock.padding,
    top: dock.padding,
    width: dock.itemWidth,
    height: dock.itemHeight,
    borderRadius: radii.dockItem,
    backgroundColor: colors.accentTint,
  },
});
