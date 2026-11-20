// BUSINESS LAYER: filter recipes by hands-on time and number of people.
import type { RecipeRepository } from '../domain/RecipeRepository';
import type { RecipeSummary } from '../domain/recipe';

export type RecipeFilter = {
  servingRange?: { min: number; max: number };
  maxActiveMinutes?: number;
  mealPrepOnly?: boolean;
  /** Kept for existing callers; the Results-style UI uses servingRange instead. */
  people?: number;
};

/** A recipe fits when it meets every selected time, serving, and Meal Prep condition. */
export async function filterRecipes(repo: RecipeRepository, filter: RecipeFilter): Promise<RecipeSummary[]> {
  const servingRange = filter.servingRange;
  if (
    servingRange &&
    (!Number.isInteger(servingRange.min) ||
      !Number.isInteger(servingRange.max) ||
      servingRange.min < 1 ||
      servingRange.max < servingRange.min)
  ) {
    throw new RangeError('The serving range must be positive whole numbers with minimum at most maximum.');
  }
  if (
    filter.maxActiveMinutes !== undefined &&
    (!Number.isInteger(filter.maxActiveMinutes) || filter.maxActiveMinutes < 1)
  ) {
    throw new RangeError('Maximum active time must be a positive whole number of minutes.');
  }
  if (filter.people !== undefined && (!Number.isInteger(filter.people) || filter.people < 1)) {
    throw new RangeError('The number of people must be a positive whole number.');
  }

  const recipes = await repo.listRecipeSummaries();
  const mealPrepIds = filter.mealPrepOnly ? new Set(await repo.listRecipeIdsByTag('Meal Prep')) : null;
  return recipes
    .filter(
      (recipe) =>
        (!servingRange ||
          !(recipe.servingsMin > servingRange.max || recipe.servingsMax < servingRange.min)) &&
        (filter.maxActiveMinutes === undefined || recipe.activeTimeMinutes <= filter.maxActiveMinutes) &&
        (filter.people === undefined || recipe.servingsMax >= filter.people) &&
        (!mealPrepIds || mealPrepIds.has(recipe.id)),
    )
    .sort((a, b) => a.activeTimeMinutes - b.activeTimeMinutes || a.name.localeCompare(b.name));
}
