// COMPOSITION ROOT: the one place concrete data implementations are wired into services.
// Call once at app startup. Device-only (it opens the real database), so it is verified in Expo Go.
import { createRecipeServices, type RecipeServices } from './createRecipeServices';
import { openRecipeDatabase } from './data/openRecipeDatabase';
import { openUserDatabase } from './data/openUserDatabase';
import { SqlitePantryRepository } from './data/SqlitePantryRepository';
import { SqliteRecipeRepository } from './data/SqliteRecipeRepository';

export async function startRecipeServices(): Promise<RecipeServices> {
  const db = await openRecipeDatabase();
  // user.db opens the first time the pantry loads, so a problem with it never stops the recipes from opening.
  return createRecipeServices(new SqliteRecipeRepository(db), new SqlitePantryRepository(openUserDatabase));
}
