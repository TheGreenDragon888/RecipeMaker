// PRESENTATION LAYER: for route files. Screens stay loaded behind one another, so a route passes this key to its
// screen, and the screen reads what may have changed elsewhere (bookmarks, the pantry) when the key changes.
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

/** Changes each time the screen comes back into view. The first time doesn't count: the screen is loading then anyway. */
export function useFocusRefreshKey(): number {
  const [key, setKey] = useState(0);
  const seenOnce = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (seenOnce.current) setKey((current) => current + 1);
      seenOnce.current = true;
    }, []),
  );
  return key;
}
