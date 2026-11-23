// BUSINESS LAYER: the rule for which recipes pass a filter (hands-on time, number of people, serving range, Meal Prep).
// filterRecipes and findRecipesFromPantry both use it, so the two lists can't drift apart.
import type { RecipeSummary } from './recipe';

export type RecipeFilter = {
  /** A recipe fits when its serving range overlaps this one. */
  servingRange?: { min: number; max: number };
  /** A recipe fits when its hands-on (active) time is at most this many minutes. */
  maxActiveMinutes?: number;
  /** A recipe fits when it serves at least this many people. */
  people?: number;
  /** Only recipes tagged "Meal Prep". */
  mealPrepOnly?: boolean;
};

const isPositiveInteger = (value: number) => Number.isInteger(value) && value >= 1;

/** Throws a RangeError when a selected value can't be used. An empty filter is fine. */
export function assertValidRecipeFilter(filter: RecipeFilter): void {
  const { servingRange, maxActiveMinutes, people } = filter;
  if (servingRange && (!isPositiveInteger(servingRange.min) || !isPositiveInteger(servingRange.max) || servingRange.max < servingRange.min)) {
    throw new RangeError('The serving range must be positive whole numbers with minimum at most maximum.');
  }
  if (maxActiveMinutes !== undefined && !isPositiveInteger(maxActiveMinutes)) {
    throw new RangeError('Maximum active time must be a positive whole number of minutes.');
  }
  if (people !== undefined && !isPositiveInteger(people)) {
    throw new RangeError('The number of people must be a positive whole number.');
  }
}

/**
 * Whether a recipe passes every selected condition. `mealPrepIds` is the set of recipes tagged "Meal Prep"; it is
 * only read when `mealPrepOnly` is on, so callers can pass null otherwise.
 */
export function matchesRecipeFilter(
  recipe: RecipeSummary,
  filter: RecipeFilter,
  mealPrepIds: ReadonlySet<number> | null,
): boolean {
  const { servingRange, maxActiveMinutes, people, mealPrepOnly } = filter;
  return (
    (!servingRange || !(recipe.servingsMin > servingRange.max || recipe.servingsMax < servingRange.min)) &&
    (maxActiveMinutes === undefined || recipe.activeTimeMinutes <= maxActiveMinutes) &&
    (people === undefined || recipe.servingsMax >= people) &&
    (!mealPrepOnly || (mealPrepIds?.has(recipe.id) ?? false))
  );
}

/** Whether two filters select exactly the same conditions; no filter counts as an empty one, and Meal Prep off as unmentioned. */
export function sameRecipeFilter(a: RecipeFilter | undefined, b: RecipeFilter | undefined): boolean {
  return (
    a?.maxActiveMinutes === b?.maxActiveMinutes &&
    a?.people === b?.people &&
    (a?.mealPrepOnly ?? false) === (b?.mealPrepOnly ?? false) &&
    a?.servingRange?.min === b?.servingRange?.min &&
    a?.servingRange?.max === b?.servingRange?.max
  );
}

/** How many conditions a filter selects: the number on the Filters button. */
export function activeFilterCount(filter: RecipeFilter): number {
  return [
    filter.servingRange !== undefined,
    filter.maxActiveMinutes !== undefined,
    filter.people !== undefined,
    filter.mealPrepOnly === true,
  ].filter(Boolean).length;
}
