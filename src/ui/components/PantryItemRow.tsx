// PRESENTATION LAYER: one ingredient in the pantry list, with a button to remove it.
// The mockup's category dot, category label and quantity stepper are left out: no data backs them.
// The remove button borrows the stepper's look (a small round button inside an outlined pill).
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatIngredientName } from '../format/pantryInfo';
import { colors, fonts, fontSize, radii, spacing } from '../theme';
import { Icon } from './Icon';

type Props = {
  name: string;
  onRemove: () => void;
};

export function PantryItemRow({ name, onRemove }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.name}>{formatIngredientName(name)}</Text>
      {/* The whole pill is the button: a child can't be tapped outside its parent, so hitSlop on the
          inner circle would do nothing. 34px pill + 5px slop on each side = a 44px touch area. */}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Remove ${name}`}
        hitSlop={5}
        onPress={onRemove}
        style={styles.pill}
      >
        {({ pressed }) => (
          <View style={[styles.remove, pressed && styles.removePressed]}>
            <Icon name="close" size={14} color={colors.accent} strokeWidth={2.5} />
          </View>
        )}
      </Pressable>
    </View>
  );
}

const REMOVE_SIZE = 26;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 13,
    paddingHorizontal: spacing.xxs,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  name: { flex: 1, fontSize: fontSize.emphasis, fontFamily: fonts.bold, color: colors.text },
  pill: {
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  remove: {
    width: REMOVE_SIZE,
    height: REMOVE_SIZE,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePressed: { backgroundColor: colors.pressed },
});
