// PRESENTATION LAYER: the search box at the top of a list, with its icon and the X that empties it.
import React, { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors, fonts, fontSize, radii, spacing } from '../theme';
import { ClearFieldButton } from './ClearFieldButton';
import { Icon } from './Icon';

type Props = {
  /** What screen readers call the field. */
  label: string;
  placeholder: string;
  clearLabel: string;
  value: string;
  onChangeText: (text: string) => void;
};

export function SearchField({ label, placeholder, clearLabel, value, onChangeText }: Props) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[styles.field, focused && styles.focused]}>
      <Icon name="search" size={18} color={colors.textMuted} />
      <TextInput
        accessibilityLabel={label}
        autoCapitalize="none"
        autoCorrect={false}
        onBlur={() => setFocused(false)}
        onChangeText={onChangeText}
        onFocus={() => setFocused(true)}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        returnKeyType="search"
        style={styles.input}
        value={value}
      />
      {value ? <ClearFieldButton label={clearLabel} onPress={() => onChangeText('')} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    marginHorizontal: spacing.screen,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  focused: { borderWidth: 1.5, borderColor: colors.accent },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSize.input,
    color: colors.text,
    paddingVertical: 10,
    paddingHorizontal: 0,
  },
});
