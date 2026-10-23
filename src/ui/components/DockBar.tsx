// PRESENTATION LAYER: the floating bottom dock from the board, a rounded pill that holds the tab buttons.
// Its background depends on the device (see platform/dockSurface): Liquid Glass, a blur, or a see-through fill.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView } from 'expo-glass-effect';
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

export function DockBar({ surface, bottom, blurTarget, children }: Props) {
  return (
    <View
      accessibilityRole="tablist"
      pointerEvents="box-none"
      style={[styles.floating, { bottom }, surface === 'translucent' && styles.translucent]}
    >
      {surface === 'liquidGlass' ? (
        <GlassView isInteractive glassEffectStyle="regular" style={styles.pill}>
          {children}
        </GlassView>
      ) : surface === 'blur' ? (
        <BlurView tint="light" intensity={BLUR_INTENSITY} style={[styles.pill, styles.outlined]}>
          {children}
        </BlurView>
      ) : surface === 'androidBlur' ? (
        <BlurView
          tint="light"
          intensity={BLUR_INTENSITY}
          blurMethod="dimezisBlurViewSdk31Plus"
          blurTarget={blurTarget}
          style={[styles.pill, styles.outlined]}
        >
          {children}
        </BlurView>
      ) : (
        <View style={[styles.pill, styles.outlined]}>{children}</View>
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
});
