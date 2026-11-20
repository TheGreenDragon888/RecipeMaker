// PRESENTATION LAYER: which recipes are saved, for a screen that shows bookmark buttons. A tap shows at once and is
// saved behind it; if the save fails the button goes back and the screen can say so. Screens stay loaded behind one
// another, so each passes a key that changes when it comes back into view, and the ids are read again then.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { RecipeServices } from '../createRecipeServices';

/** How long a screen shows that a bookmark couldn't be saved. */
export const BOOKMARK_NOTICE_MS = 3000;

type SavedIds = ReadonlySet<number>;

function withRecipe(ids: SavedIds, recipeId: number, saved: boolean): SavedIds {
  const next = new Set(ids);
  if (saved) next.add(recipeId);
  else next.delete(recipeId);
  return next;
}

function sameIds(a: SavedIds | null, b: SavedIds): boolean {
  return a !== null && a.size === b.size && [...b].every((id) => a.has(id));
}

export function useRecipeBookmarks(services: RecipeServices, refreshKey = 0) {
  /** Null until the ids load, and for good if they never can: the screen then shows no bookmark buttons. */
  const [savedIds, setSavedIds] = useState<SavedIds | null>(null);
  /** Failed saves since the notice last went away; each one restarts its timer. */
  const [failures, setFailures] = useState(0);
  // What taps read, since two quick taps can land before the screen redraws.
  const latestIds = useRef<SavedIds | null>(null);
  const tapCount = useRef(0);
  const lastTapOn = useRef(new Map<number, number>());

  const show = useCallback((ids: SavedIds) => {
    latestIds.current = ids;
    setSavedIds(ids);
  }, []);

  useEffect(() => {
    let current = true;
    const tapsWhenStarted = tapCount.current;
    services.listBookmarkIds().then(
      (ids) => {
        // A tap since this read started is newer than what it found.
        if (!current || tapCount.current !== tapsWhenStarted) return;
        const loaded = new Set(ids);
        // The same set stays, so lists built from it don't redraw for nothing.
        if (!sameIds(latestIds.current, loaded)) show(loaded);
      },
      () => {
        // Bookmarks are extra here: the screen carries on with what it knows.
      },
    );
    return () => {
      current = false;
    };
  }, [services, refreshKey, show]);

  useEffect(() => {
    if (failures === 0) return;
    const timer = setTimeout(() => setFailures(0), BOOKMARK_NOTICE_MS);
    return () => clearTimeout(timer);
  }, [failures]);

  const toggle = useCallback(
    (recipeId: number) => {
      const ids = latestIds.current;
      if (ids === null) return;
      const wasSaved = ids.has(recipeId);
      tapCount.current += 1;
      const tap = tapCount.current;
      lastTapOn.current.set(recipeId, tap);
      show(withRecipe(ids, recipeId, !wasSaved));
      const saving = wasSaved ? services.removeBookmark(recipeId) : services.addBookmark(recipeId);
      saving.catch(() => {
        // A later tap on this recipe has already decided how it should look.
        if (lastTapOn.current.get(recipeId) !== tap || latestIds.current === null) return;
        show(withRecipe(latestIds.current, recipeId, wasSaved));
        setFailures((count) => count + 1);
      });
    },
    [services, show],
  );

  return { savedIds, toggle, saveFailed: failures > 0 };
}
