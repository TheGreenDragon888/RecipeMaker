// PRESENTATION LAYER: the pieces the board's bottom sheets share (the seasoning tray and the amount sheet):
// the grab bar at the top, the header with its icon tile and badge, a small section label, and the wide
// footer button (Done, Save, or a clay Remove), with an optional outlined button beside it (Remove).
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSize, radii, spacing } from '../theme';
import { Icon, type IconName } from './Icon';
import { PressableScale } from './PressableScale';

/** The bar at the top of a sheet; tapping it closes the sheet. */
export function SheetGrabBar({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.grabArea}>
      <View style={styles.grabber} />
    </Pressable>
  );
}

type HeaderProps = { icon: IconName; title: string; subtitle: string; badge: string };

/** A sheet's header: a blue icon tile, the title (one line) over a subtitle, and a badge at the end. */
export function SheetHeader({ icon, title, subtitle, badge }: HeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerIcon}>
        <Icon name={icon} size={22} color={colors.blue} />
      </View>
      <View style={styles.headerText}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <Text style={styles.badge}>{badge}</Text>
    </View>
  );
}

/** A small uppercase heading over a group of chips ("Everyday", "Unit"). */
export function SheetSectionLabel({ text }: { text: string }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

/** A smaller outlined button beside the footer's main one (the amount sheet's Remove). */
type SideButton = { label: string; accessibilityLabel: string; icon: IconName; onPress: () => void };

type FooterButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** What screen readers hear, when it should say more than the label ("Remove Garlic from your pantry"). */
  accessibilityLabel?: string;
  /** Blue, or clay for a button that removes something. */
  tone?: 'primary' | 'remove';
  side?: SideButton;
};

/** The sheet's footer: a line above, and one wide button (blue, or clay to remove), with an optional side button before it. */
export function SheetFooterButton({ label, onPress, disabled = false, accessibilityLabel, tone = 'primary', side }: FooterButtonProps) {
  return (
    <View style={[styles.footer, styles.footerRow]}>
      {side ? (
        <PressableScale
          size="button"
          accessibilityRole="button"
          accessibilityLabel={side.accessibilityLabel}
          onPress={side.onPress}
          // Android fades the button as one picture, not its border, icon and label separately (see AGENTS.md §5.2).
          needsOffscreenAlphaCompositing
          style={({ pressed }) => [styles.sideButton, pressed && styles.sidePressed]}
        >
          <Icon name={side.icon} size={18} color={colors.accent} strokeWidth={2} />
          <Text style={styles.sideText}>{side.label}</Text>
        </PressableScale>
      ) : null}
      <PressableScale
        size="button"
        wrapperStyle={styles.mainWrapper}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        // Android fades the button as one picture, not its fill and label separately (see AGENTS.md §5.2).
        needsOffscreenAlphaCompositing
        style={[styles.button, tone === 'remove' && styles.buttonRemove, disabled && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>{label}</Text>
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  grabArea: { height: 30, alignItems: 'center', justifyContent: 'center' },
  grabber: { width: 40, height: 5, borderRadius: 3, backgroundColor: colors.grabber },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingTop: spacing.xs,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.md,
  },
  headerIcon: {
    width: 42,
    height: 42,
    borderRadius: radii.tile,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.blueSoft,
  },
  headerText: { flex: 1 },
  title: { fontFamily: fonts.heading, fontSize: fontSize.sheetTitle, color: colors.text },
  subtitle: { fontFamily: fonts.regular, fontSize: fontSize.meta, color: colors.textSecondary },
  badge: {
    overflow: 'hidden',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: radii.pill,
    backgroundColor: colors.blueSoft,
    fontSize: fontSize.caption,
    fontFamily: fonts.heavy,
    color: colors.blue,
  },
  sectionLabel: {
    fontSize: fontSize.caption,
    fontFamily: fonts.heavy,
    color: colors.textMuted,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  footer: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
  footerRow: { flexDirection: 'row', gap: spacing.sm },
  mainWrapper: { flex: 1 },
  sideButton: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.accent,
    backgroundColor: colors.surface,
  },
  sidePressed: { backgroundColor: colors.accentWash },
  sideText: { fontSize: fontSize.emphasis, fontFamily: fonts.heavy, color: colors.accent },
  button: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    backgroundColor: colors.blue,
  },
  buttonRemove: { backgroundColor: colors.accent },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { fontSize: fontSize.emphasis, fontFamily: fonts.heavy, color: colors.onAccent },
});
