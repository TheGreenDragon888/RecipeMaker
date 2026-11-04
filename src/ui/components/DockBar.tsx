// PRESENTATION LAYER: the floating bottom dock from the board, a rounded pill that holds the tab buttons.
// Its background depends on the device (see platform/dockSurface): a blur, or a see-through fill.
// One accent-tinted pill sits behind the current tab. Each DockItem tells the dock, through DockSlotContext,
// whether it is selected, so the dock knows where to put the pill without being told by the tab navigator.
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { indicatorOffset } from '../motion/dockSwipe';
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

/** Called by a tab in the dock on every change, so the dock knows which tab is selected. Does nothing elsewhere. */
export function useReportToDock({ isFocused, disabled, onPress }: DockItemReport) {
  const slot = useContext(DockSlotContext);
  useEffect(() => {
    slot?.report(slot.index, { isFocused, disabled, onPress });
  }, [slot, isFocused, disabled, onPress]);
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

  const reduceMotion = useReduceMotion();
  const pillX = useRef(new Animated.Value(0)).current;
  /** Whether the pill has a place yet; the first place is set, not slid to. */
  const placed = useRef(false);
  useEffect(() => {
    if (focused === null) return;
    const toValue = indicatorOffset(focused);
    if (!placed.current || reduceMotion) {
      placed.current = true;
      pillX.stopAnimation();
      pillX.setValue(toValue);
      return;
    }
    // The JS driver, as in SeasoningDrawer: Jest's stand-in for the native driver never moves the value, so
    // a native-driven pill couldn't be tested.
    Animated.spring(pillX, { toValue, ...PILL_SPRING, useNativeDriver: false }).start();
  }, [focused, pillX, reduceMotion]);

  const content = (
    <>
      {focused !== null && (
        <Animated.View
          testID="dock-indicator"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.indicator, { transform: [{ translateX: pillX }] }]}
        />
      )}
      {React.Children.toArray(children).map((child, index) => (
        <DockSlotContext.Provider key={index} value={slotAt(index)}>
          {child}
        </DockSlotContext.Provider>
      ))}
    </>
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
    flexDirection: 'row',
    padding: dock.padding,
    borderRadius: radii.dock,
    // A blur only takes the rounded corners when it clips its content.
    overflow: 'hidden',
  },
  outlined: { borderWidth: 0.5, borderColor: colors.dockBorder },
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
