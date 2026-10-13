// PRESENTATION LAYER: a centered message for a screen with nothing else to show (no matches, an error),
// with an optional button for what to do next.
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, fontSize, spacing } from '../theme';
import { PrimaryButton } from './PrimaryButton';

type Props = {
  message: string;
  action?: { label: string; onPress: () => void };
};

export function StateMessage({ message, action }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {action ? (
        <View style={styles.action}>
          <PrimaryButton label={action.label} onPress={action.onPress} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.screen, paddingBottom: spacing.xxxl },
  message: { fontFamily: fonts.regular, fontSize: fontSize.emphasis, color: colors.textSecondary, textAlign: 'center' },
  action: { marginTop: spacing.xxl },
});
