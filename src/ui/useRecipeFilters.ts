// PRESENTATION LAYER: what Recipes and Results share about their Filters sheet: whether it is open, the filters in
// force, and how many recipes the sheet's choices would show (counted again after every change, newest reply wins).
// The screen gives it `countFor`, which asks a service how many recipes a set of choices shows, since only screens
// call services. Closing the sheet applies its choices; empty choices apply nothing (`applied` is undefined), and the
// same choices again keep the same object, so a screen that searches whenever `applied` changes doesn't search twice.
import { useCallback, useRef, useState } from 'react';
import { Keyboard } from 'react-native';
import { activeFilterCount, sameRecipeFilter, type RecipeFilter } from '../domain/recipeFilter';

export type RecipeFiltersState = {
  open: boolean;
  /** The filters in force, or undefined when none is selected. */
  applied: RecipeFilter | undefined;
  /** How many conditions are selected (the Filters button's badge). */
  activeCount: number;
  /** How many recipes the sheet's choices show, or null while that is being counted (or when counting failed). */
  count: number | null;
  /** Opens the sheet, counting the filters now in force. */
  show: () => void;
  /** The sheet's choices changed: count again. */
  onChange: (draft: RecipeFilter) => void;
  /** The sheet closed with these choices: apply them. */
  onClose: (draft: RecipeFilter) => void;
};

export function useRecipeFilters(countFor: (draft: RecipeFilter) => Promise<number>): RecipeFiltersState {
  const [open, setOpen] = useState(false);
  const [applied, setApplied] = useState<RecipeFilter | undefined>(undefined);
  const [count, setCount] = useState<number | null>(null);
  /** Numbers each count, so only the newest one's reply is used. */
  const latestCount = useRef(0);
  // The screen makes a new countFor as its search text changes; the newest one is the one to ask.
  const latestCountFor = useRef(countFor);
  latestCountFor.current = countFor;
  const latestApplied = useRef(applied);
  latestApplied.current = applied;

  const onChange = useCallback((draft: RecipeFilter) => {
    const request = ++latestCount.current;
    setCount(null);
    latestCountFor.current(draft).then(
      (shown) => {
        if (latestCount.current === request) setCount(shown);
      },
      () => {
        // Counting is only a nicety; without it the sheet's button just says "Show recipes".
      },
    );
  }, []);

  const show = useCallback(() => {
    Keyboard.dismiss();
    onChange(latestApplied.current ?? {});
    setOpen(true);
  }, [onChange]);

  const onClose = useCallback((draft: RecipeFilter) => {
    latestCount.current += 1;
    setCount(null);
    setOpen(false);
    setApplied((current) => {
      const next = activeFilterCount(draft) > 0 ? draft : undefined;
      return sameRecipeFilter(current, next) ? current : next;
    });
  }, []);

  return { open, applied, activeCount: applied ? activeFilterCount(applied) : 0, count, show, onChange, onClose };
}
