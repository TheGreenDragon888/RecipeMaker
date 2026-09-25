// BUSINESS LAYER: ingredient autocomplete.
import type { RecipeRepository } from '../domain/RecipeRepository';
import { normalizeSearchTerm } from '../domain/searchTerm';

const MAX_SUGGESTIONS = 10;

export async function suggestIngredients(repo: RecipeRepository, rawPrefix: string): Promise<string[]> {
  const prefix = normalizeSearchTerm(rawPrefix);
  if (!prefix) return [];
  return repo.suggestIngredients(prefix, MAX_SUGGESTIONS);
}
