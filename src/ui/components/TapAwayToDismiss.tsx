// PRESENTATION LAYER: wraps a whole screen so a tap on any part of it that does nothing by itself (a title, the
// space around a field, an empty-state message) closes the keyboard. React Native only acts on a tap that some view
// in the touch's ancestry handles, and a plain View handles none, so without this the keyboard stays up wherever
// the screen has no scroll view under the finger. A button, a card or a text field inside keeps its own tap, and
// a scroll view with keyboardShouldPersistTaps="handled" still closes the keyboard for the taps on it.
import React, { type ReactNode } from 'react';
import { Keyboard, StyleSheet, TouchableWithoutFeedback, View, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  children?: ReactNode;
  /** Runs after the keyboard is told to close: a screen closes what else it floats (Recipes' filter panel). */
  onDismiss?: () => void;
  /** Added to the wrapper's own style, which fills the space the screen gives it. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function TapAwayToDismiss({ children, onDismiss, style, testID }: Props) {
  return (
    <TouchableWithoutFeedback
      // Not a button to a screen reader: its job is only to close the keyboard.
      accessible={false}
      onPress={() => {
        Keyboard.dismiss();
        onDismiss?.();
      }}
    >
      <View style={[styles.fill, style]} testID={testID}>
        {children}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
