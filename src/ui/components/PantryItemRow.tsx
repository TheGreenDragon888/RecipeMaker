// PRESENTATION LAYER: one ingredient in the pantry list, with a button to remove it.
// The mockup's category dot, category label and quantity stepper are left out: no data backs them.
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fontSize, fontWeight, radii, spacing } from '../theme';

type Props = {
  name: string;
  onRemove: () => void;
};

export function PantryItemRow({ name, onRemove }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.name}>{name}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Remove ${name}`}
        hitSlop={6}
        onPress={onRemove}
        style={({ pressed }) => [styles.remove, pressed && styles.removePressed]}
      >
        <Text style={styles.removeText}>×</Text>
      </Pressable>
    </View>
  );
}

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
  name: { flex: 1, fontSize: fontSize.emphasis, fontWeight: fontWeight.bold, color: colors.text },
  remove: {
    width: 32,
    height: 32,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  removePressed: { backgroundColor: colors.pressed },
  removeText: { fontSize: fontSize.sectionTitle, fontWeight: fontWeight.bold, color: colors.accent, lineHeight: 20 },
});
