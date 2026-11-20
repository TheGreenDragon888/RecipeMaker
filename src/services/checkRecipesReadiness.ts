// BUSINESS LAYER: how ready several recipes are to cook from the saved pantry, for their cards.
import type { PantryRepository } from '../domain/PantryRepository';
import { summarizeReadiness, type RecipeReadiness } from '../domain/recipeReadiness';
import type { RecipeRepository } from '../domain/RecipeRepository';
import { checkLinesAgainstOnHand } from './checkRecipeAgainstPantry';
import { loadSavedPantry } from './loadSavedPantry';

/**
 * Each recipe's readiness by id, or null when the pantry is empty and there is nothing to compare with. Fails when
 * the recipe data or the saved pantry can't be read.
 */
export async function checkRecipesReadiness(
  recipeRepo: RecipeRepository,
  pantryRepo: PantryRepository,
  recipeIds: number[],
): Promise<Map<number, RecipeReadiness> | null> {
  const { pantry, seasoningsOn } = await loadSavedPantry(pantryRepo, recipeRepo);
  if (pantry.length === 0 && seasoningsOn.length === 0) return null;
  const onHand = { items: pantry, seasoningsOn };
  const entries = await Promise.all(
    recipeIds.map(async (recipeId): Promise<[number, RecipeReadiness]> => {
      const lines = await recipeRepo.getIngredients(recipeId);
      return [recipeId, summarizeReadiness(lines, await checkLinesAgainstOnHand(recipeRepo, lines, onHand))];
    }),
  );
  return new Map(entries);
}
