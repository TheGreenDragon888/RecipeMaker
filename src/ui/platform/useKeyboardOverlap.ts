// PRESENTATION LAYER: follows the on-screen keyboard: how much of the screen's bottom it covers, and how long
// it takes to get there (0 on Android, which reports the keyboard only once it has moved).
import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';
import { keyboardEventsFor, keyboardOverlap } from './keyboardLift';

export type KeyboardOverlap = { overlap: number; duration: number };

/** The keyboard's overlap with the bottom of the screen; bottomInset is the safe area's bottom inset. */
export function useKeyboardOverlap(bottomInset: number): KeyboardOverlap {
  const [state, setState] = useState<KeyboardOverlap>({ overlap: 0, duration: 0 });
  useEffect(() => {
    const events = keyboardEventsFor(Platform.OS);
    const shown = Keyboard.addListener(events.show, (event) => {
      const overlap = keyboardOverlap({ platform: Platform.OS, keyboardHeight: event.endCoordinates.height, bottomInset });
      setState({ overlap, duration: event.duration ?? 0 });
    });
    const hidden = Keyboard.addListener(events.hide, (event) => setState({ overlap: 0, duration: event?.duration ?? 0 }));
    return () => {
      shown.remove();
      hidden.remove();
    };
  }, [bottomInset]);
  return state;
}
