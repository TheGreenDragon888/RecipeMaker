// PRESENTATION LAYER: the board's dark bar that floats above the bottom of a screen and says what just happened,
// with an optional button ("Removed Chili", Undo). The screen decides when it shows and for how long.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSize, radii, shadows, spacing } from '../theme';
import { PressableScale } from './PressableScale';

type Props = {
  message: string;
  /** Distance from the bottom of the screen. */
  bottom: number;
  action?: { label: string; accessibilityLabel: string; onPress: () => void };
};

export function NoticeBar({ message, bottom, action }: Props) {
  return (
    <View style={[styles.bar, { bottom }]}>
      {/* The role is on the text, not the bar: an accessible bar would hide its button from screen readers. */}
      <Text accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.message} numberOfLines={1}>
        {message}
      </Text>
      {action ? (
        <PressableScale
          size="small"
          accessibilityRole="button"
          accessibilityLabel={action.accessibilityLabel}
          onPress={action.onPress}
          // Android fades the button as one picture, not its fill and label separately (see AGENTS.md §5.2).
          needsOffscreenAlphaCompositing
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}
        >
          <Text style={styles.buttonLabel}>{action.label}</Text>
        </PressableScale>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: spacing.screen,
    right: spacing.screen,
    zIndex: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 56,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.xl,
    paddingRight: spacing.sm,
    borderRadius: radii.lg,
    backgroundColor: colors.text,
    ...shadows.noticeBar,
  },
  message: { flex: 1, fontFamily: fonts.regular, fontSize: fontSize.body, color: colors.onAccent },
  button: {
    minHeight: 40,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    borderRadius: 12,
    backgroundColor: colors.noticeButton,
  },
  pressed: { opacity: 0.8 },
  buttonLabel: { fontFamily: fonts.heavy, fontSize: fontSize.body, color: colors.amberSoft },
});
