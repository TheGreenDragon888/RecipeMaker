// PRESENTATION LAYER: whether the phone's Reduce Motion setting is on, for sheets that jump instead of sliding.
import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** Whether the phone's Reduce Motion setting is on (false until it is known); follows changes to it. */
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let current = true;
    AccessibilityInfo.isReduceMotionEnabled().then(
      (enabled) => {
        if (current) setReduceMotion(enabled);
      },
      () => {},
    );
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      current = false;
      subscription.remove();
    };
  }, []);
  return reduceMotion;
}
