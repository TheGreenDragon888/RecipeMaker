// BUSINESS LAYER: bring back the pantry saved on an earlier launch, fitted to the recipe data as it is now.
import type { PantryRepository } from '../domain/PantryRepository';
import type { RecipeRepository } from '../domain/RecipeRepository';
import { restoreSavedPantry, type RestoredPantry } from '../domain/savedPantry';
import { getPantryCatalog } from './getPantryCatalog';

/**
 * Loads the saved pantry and fits it to the current recipe data (see restoreSavedPantry). A name that a data
 * update turned into an alias ("scallions" for "green onion") is followed to its new name first. Fails when
 * either the saved pantry or the recipe data can't be read.
 */
export async function loadSavedPantry(pantryRepo: PantryRepository, recipeRepo: RecipeRepository): Promise<RestoredPantry> {
  const [saved, catalog] = await Promise.all([pantryRepo.load(), getPantryCatalog(recipeRepo)]);
  const [itemNames, seasoningsOn] = await Promise.all([
    recipeRepo.resolveIngredientNames(saved.items.map((item) => item.name)),
    recipeRepo.resolveIngredientNames(saved.seasoningsOn),
  ]);
  const items = saved.items.map((item, i) => ({ ...item, name: itemNames[i] }));
  return restoreSavedPantry({ items, seasoningsOn }, catalog);
}
