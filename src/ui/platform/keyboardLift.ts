// PRESENTATION LAYER: how far a bottom sheet with a text field must rise to stay above the on-screen keyboard.
// Neither iOS nor Android (edge-to-edge) moves the app's views when the keyboard opens, so the sheet lifts itself.
// The rules are here, as pure functions, so they're tested; useKeyboardOverlap feeds them the keyboard's events.

/** The Keyboard events to listen to: iOS says the keyboard is about to move; Android only that it has. */
export function keyboardEventsFor(platform: string): { show: 'keyboardWillShow' | 'keyboardDidShow'; hide: 'keyboardWillHide' | 'keyboardDidHide' } {
  return platform === 'ios'
    ? { show: 'keyboardWillShow', hide: 'keyboardWillHide' }
    : { show: 'keyboardDidShow', hide: 'keyboardDidHide' };
}

type OverlapInput = { platform: string; keyboardHeight: number; bottomInset: number };

/**
 * How much of the screen's bottom the keyboard covers. On Android React Native leaves the navigation bar out of
 * the keyboard's height, so the bottom inset is added back. (Check this on a real Android phone in Expo Go.)
 */
export function keyboardOverlap({ platform, keyboardHeight, bottomInset }: OverlapInput): number {
  if (keyboardHeight <= 0) return 0;
  return platform === 'android' ? keyboardHeight + bottomInset : keyboardHeight;
}

/** Space left between the keyboard's top and the sheet's bottom edge. */
export const KEYBOARD_GAP = 8;

/** Where the sheet's bottom edge goes: where it rests, or just above the keyboard when that is higher. */
export function liftedSheetBottom({ restingBottom, overlap }: { restingBottom: number; overlap: number }): number {
  return overlap > 0 ? Math.max(restingBottom, overlap + KEYBOARD_GAP) : restingBottom;
}
