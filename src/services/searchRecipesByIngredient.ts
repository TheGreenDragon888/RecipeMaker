// BUSINESS LAYER: find recipes that use one ingredient.
import type { RecipeRepository } from '../domain/RecipeRepository';
import type { RecipeSummary } from '../domain/recipe';
import { normalizeSearchTerm } from '../domain/searchTerm';

/** Exact (alias-aware) match first; if nothing matches, falls back to a partial name match. */
export async function searchRecipesByIngredient(
  repo: RecipeRepository,
  raw: string,
): Promise<RecipeSummary[]> {
  const term = normalizeSearchTerm(raw);
  if (!term) return [];
  const exact = await repo.findByIngredient(term);
  if (exact.length > 0) return exact;
  return repo.findByIngredientContaining(term);
}
