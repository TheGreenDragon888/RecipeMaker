// BUSINESS LAYER: filter recipes by hands-on time and number of people.
import type { RecipeRepository } from '../domain/RecipeRepository';
import type { RecipeSummary } from '../domain/recipe';

export type RecipeFilter = {
  maxActiveMinutes: number;
  people: number;
};

/** A recipe fits when its active time is within the limit and its serving range reaches `people`. */
export async function filterRecipes(repo: RecipeRepository, filter: RecipeFilter): Promise<RecipeSummary[]> {
  const recipes = await repo.listRecipeSummaries();
  return recipes
    .filter((r) => r.activeTimeMinutes <= filter.maxActiveMinutes && r.servingsMax >= filter.people)
    .sort((a, b) => a.activeTimeMinutes - b.activeTimeMinutes || a.name.localeCompare(b.name));
}
