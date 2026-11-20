// PRESENTATION LAYER: how ready the recipes a screen is showing are to cook. A screen says which recipes it shows with
// watch(); only those are checked, because checking all of them at once would take seconds. One check runs at a time,
// and recipes that turn up meanwhile go into the next one. Results are remembered, and the shown recipes are checked
// again when the screen comes back into view. A result that didn't change stays the same object, so cards don't redraw.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { RecipeServices } from '../createRecipeServices';
import type { ReadinessById, RecipeReadiness } from '../domain/recipeReadiness';

/** checking: no reply yet. noPantry: nothing saved to compare with. failed: the last check couldn't be done. */
export type ReadinessState = 'checking' | 'done' | 'noPantry' | 'failed';

export type RecipeReadinessState = {
  /** What is known so far, by recipe id. */
  readiness: ReadinessById;
  state: ReadinessState;
  /** Marks recipes as being shown, until the function it returns is called. Stays the same between redraws. */
  watch: (recipeIds: number[]) => () => void;
};

type Shown = Pick<RecipeReadinessState, 'readiness' | 'state'>;

const NOTHING_KNOWN: ReadinessById = new Map();

function sameReadiness(a: RecipeReadiness, b: RecipeReadiness): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** `known` with the new results added. Returns `known` itself when none of them changes anything. */
function withResults(known: ReadinessById, results: ReadinessById): ReadinessById {
  let merged: Map<number, RecipeReadiness> | null = null;
  for (const [recipeId, result] of results) {
    const previous = known.get(recipeId);
    if (previous && sameReadiness(previous, result)) continue;
    merged ??= new Map(known);
    merged.set(recipeId, result);
  }
  return merged ?? known;
}

function createChecker(services: RecipeServices, show: (change: (shown: Shown) => Shown) => void) {
  /** How many watchers each shown recipe has. */
  const watched = new Map<number, number>();
  /** Shown recipes waiting for the next check. */
  const waiting = new Set<number>();
  /** Recipes already sent to a check since the screen last came into view. */
  const sent = new Set<number>();
  /** Goes up each time the screen comes back, which makes replies to earlier checks out of date. */
  let round = 0;
  let checking = false;
  let flushQueued = false;
  /** With an empty pantry every answer is the same, so there is no need to ask again this round. */
  let pantryEmpty = false;

  function flush() {
    if (pantryEmpty) waiting.clear();
    if (checking || waiting.size === 0) return;
    const recipeIds = [...waiting];
    waiting.clear();
    for (const recipeId of recipeIds) sent.add(recipeId);
    const startedIn = round;
    checking = true;
    const finish = () => {
      checking = false;
      flush();
    };
    services.checkRecipesReadiness(recipeIds).then(
      (results) => {
        if (startedIn === round) {
          pantryEmpty = results === null;
          show(({ readiness }) =>
            results === null
              ? { readiness: NOTHING_KNOWN, state: 'noPantry' }
              : { readiness: withResults(readiness, results), state: 'done' },
          );
        }
        finish();
      },
      () => {
        if (startedIn === round) show(() => ({ readiness: NOTHING_KNOWN, state: 'failed' }));
        finish();
      },
    );
  }

  /** Waits for the current batch of screen updates, so all the recipes they show go into one check. */
  function queueFlush() {
    if (flushQueued) return;
    flushQueued = true;
    Promise.resolve().then(() => {
      flushQueued = false;
      flush();
    });
  }

  return {
    watch(recipeIds: number[]) {
      for (const recipeId of recipeIds) {
        watched.set(recipeId, (watched.get(recipeId) ?? 0) + 1);
        if (!sent.has(recipeId)) waiting.add(recipeId);
      }
      queueFlush();
      return () => {
        for (const recipeId of recipeIds) {
          const watchers = (watched.get(recipeId) ?? 0) - 1;
          if (watchers > 0) {
            watched.set(recipeId, watchers);
          } else {
            watched.delete(recipeId);
            waiting.delete(recipeId);
          }
        }
      };
    },
    checkAgain() {
      round += 1;
      pantryEmpty = false;
      sent.clear();
      waiting.clear();
      for (const recipeId of watched.keys()) waiting.add(recipeId);
      queueFlush();
    },
  };
}

export function useRecipeReadiness(services: RecipeServices, refreshKey = 0): RecipeReadinessState {
  const [shown, setShown] = useState<Shown>({ readiness: NOTHING_KNOWN, state: 'checking' });
  const checker = useMemo(
    () =>
      createChecker(services, (change) =>
        setShown((current) => {
          const next = change(current);
          // Nothing new keeps the same object, so the screen doesn't redraw.
          return next.readiness === current.readiness && next.state === current.state ? current : next;
        }),
      ),
    [services],
  );

  const lastRefreshKey = useRef(refreshKey);
  useEffect(() => {
    if (lastRefreshKey.current === refreshKey) return;
    lastRefreshKey.current = refreshKey;
    checker.checkAgain();
  }, [checker, refreshKey]);

  return { ...shown, watch: checker.watch };
}
