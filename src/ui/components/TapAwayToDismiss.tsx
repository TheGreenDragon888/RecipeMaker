// PRESENTATION LAYER: wraps a part of a screen that doesn't scroll (its header and search row, an empty-state message,
// the dropdown under a field) so a tap on any blank spot in it closes the keyboard. React Native only acts on a tap
// that some view in the touch's ancestry handles, and a plain View handles none, so without this the keyboard stays
// up wherever the screen has no scroll view under the finger. A button, a card or a text field inside keeps its own tap.
// NEVER put a scroll view (a list, a sheet's body) inside it. A touch that lands on a blank spot makes this the view
// holding the touch, and React Native won't scroll a list under such a view: iOS's scroll view refuses to scroll when
// an ancestor holds the touch, and on Android the view holding it takes the swipe from the list. A list closes the
// keyboard for its own blank spots instead, with keyboardShouldPersistTaps="handled".
import React, { type ReactNode } from 'react';
import { Keyboard, StyleSheet, TouchableWithoutFeedback, View, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  children?: ReactNode;
  /** Runs after the keyboard is told to close, for a screen that floats something over its content and closes it too. */
  onDismiss?: () => void;
  /** Whether it fills the space its parent gives it (an empty-state message does), else it is as big as what it holds (a header). */
  fill?: boolean;
  /** Added to the wrapper's own style. */
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

export function TapAwayToDismiss({ children, onDismiss, fill = true, style, testID }: Props) {
  return (
    <TouchableWithoutFeedback
      // Not a button to a screen reader: its job is only to close the keyboard.
      accessible={false}
      onPress={() => {
        Keyboard.dismiss();
        onDismiss?.();
      }}
    >
      <View style={[fill && styles.fill, style]} testID={testID}>
        {children}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
