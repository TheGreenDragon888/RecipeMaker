// PRESENTATION LAYER: the floating bottom dock from the board, a rounded pill that holds the tab buttons.
// Its background depends on the device (see platform/dockSurface): a blur, or a see-through fill.
// One accent-tinted pill sits behind the current tab. Each DockItem tells the dock, through DockSlotContext,
// whether it is selected, so the dock knows where to put the pill without being told by the tab navigator.
// A finger can also slide along the dock: a tap stays with the tab under it, but once the finger moves
// sideways (dockSwipe's startsDockSwipe) the dock takes the touch, the pill follows the finger to the tab
// that letting go would open, and letting go presses that tab. Sliding well off the dock cancels.
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { dockSlotAt, indicatorOffset, startsDockSwipe, swipeTarget } from '../motion/dockSwipe';
import { useReduceMotion } from '../motion/useReduceMotion';
import type { DockSurface } from '../platform/dockSurface';
import { colors, dock, radii, shadows } from '../theme';

type Props = {
  surface: DockSurface;
  /** Distance from the bottom of the screen, from platform/dockLayout (above the home indicator). */
  bottom: number;
  /** For the Android blur: the view holding the screens, which the dock blurs. It must not contain the dock. */
  blurTarget?: React.RefObject<React.ComponentRef<typeof View> | null>;
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

export function DockBar({ surface, bottom, blurTarget, children }: Props) {
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
  const pillAt = swipingTo ?? focused;

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
        if (chosen !== null && chosen !== latest.current.focused) items.current[chosen]?.onPress?.();
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
    <View
      accessibilityRole="tablist"
      pointerEvents="box-none"
      style={[styles.floating, { bottom }, surface === 'translucent' && styles.translucent]}
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
    </View>
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
