// PRESENTATION LAYER: Android's back button closes an open sheet (the seasoning tray, the amount sheet) instead of
// leaving the screen. It does nothing on iOS, which has no back button.
import { useEffect, useRef } from 'react';
import { BackHandler } from 'react-native';

/** While `open`, the back button calls onClose and goes no further. */
export function useCloseOnBack(open: boolean, onClose: () => void): void {
  const latestOnClose = useRef(onClose);
  latestOnClose.current = onClose;
  useEffect(() => {
    if (!open) return;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      latestOnClose.current();
      return true; // handled: Expo Router's own back handling doesn't run
    });
    return () => subscription.remove();
  }, [open]);
}
