// COMPOSITION ROOT: the one place concrete data implementations are wired into services.
// Call once at app startup. Device-only (it opens the real database), so it is verified in Expo Go.
import { createRecipeServices, type RecipeServices } from './createRecipeServices';
import { openRecipeDatabase } from './data/openRecipeDatabase';
import { SqliteRecipeRepository } from './data/SqliteRecipeRepository';

export async function startRecipeServices(): Promise<RecipeServices> {
  const db = await openRecipeDatabase();
  return createRecipeServices(new SqliteRecipeRepository(db));
}
