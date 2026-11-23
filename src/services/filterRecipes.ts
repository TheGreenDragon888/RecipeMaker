// BUSINESS LAYER: filter recipes by hands-on time, number of people, serving range and Meal Prep.
import type { RecipeRepository } from '../domain/RecipeRepository';
import type { RecipeSummary } from '../domain/recipe';
import { assertValidRecipeFilter, matchesRecipeFilter, type RecipeFilter } from '../domain/recipeFilter';

export type { RecipeFilter } from '../domain/recipeFilter';

/** A recipe fits when it meets every selected time, serving, and Meal Prep condition. Fastest first, then by name. */
export async function filterRecipes(repo: RecipeRepository, filter: RecipeFilter): Promise<RecipeSummary[]> {
  assertValidRecipeFilter(filter);

  const recipes = await repo.listRecipeSummaries();
  const mealPrepIds = filter.mealPrepOnly ? new Set(await repo.listRecipeIdsByTag('Meal Prep')) : null;
  return recipes
    .filter((recipe) => matchesRecipeFilter(recipe, filter, mealPrepIds))
    .sort((a, b) => a.activeTimeMinutes - b.activeTimeMinutes || a.name.localeCompare(b.name));
}
