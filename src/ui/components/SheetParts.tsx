// PRESENTATION LAYER: the pieces the board's bottom sheets share (the seasoning tray and the amount sheet):
// the grab bar at the top, the header with its icon tile and badge, a small section label, and the wide
// footer button (Done, Save).
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSize, radii, spacing } from '../theme';
import { Icon, type IconName } from './Icon';

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

type FooterButtonProps = { label: string; onPress: () => void; disabled?: boolean };

/** The sheet's footer: a line above, and one wide blue button. */
export function SheetFooterButton({ label, onPress, disabled = false }: FooterButtonProps) {
  return (
    <View style={styles.footer}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ disabled }}
        disabled={disabled}
        onPress={onPress}
        style={[styles.button, disabled && styles.buttonDisabled]}
      >
        <Text style={styles.buttonText}>{label}</Text>
      </Pressable>
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
  button: {
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.lg,
    backgroundColor: colors.blue,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { fontSize: fontSize.emphasis, fontFamily: fonts.heavy, color: colors.onAccent },
});
