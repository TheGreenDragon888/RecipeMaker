// BUSINESS LAYER: is this typed text an ingredient we know? Only known ingredients go in the pantry.
import type { RecipeRepository } from '../domain/RecipeRepository';
import { normalizeSearchTerm } from '../domain/searchTerm';

/** The database's name for the typed ingredient or alias ("scallions" → "green onion"), or null if unknown. */
export async function findIngredient(repo: RecipeRepository, raw: string): Promise<string | null> {
  const term = normalizeSearchTerm(raw);
  if (!term) return null;
  return repo.findIngredient(term);
}
