// BUSINESS LAYER: every recipe, for browsing on the Recipes tab.
import type { RecipeRepository } from '../domain/RecipeRepository';
import type { RecipeSummary } from '../domain/recipe';

/** All recipes in alphabetical order by name. */
export async function listAllRecipes(repo: RecipeRepository): Promise<RecipeSummary[]> {
  const recipes = await repo.listRecipeSummaries();
  return [...recipes].sort((a, b) => a.name.localeCompare(b.name));
}
