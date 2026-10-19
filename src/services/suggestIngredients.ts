// BUSINESS LAYER: ingredient autocomplete.
import type { RecipeRepository } from '../domain/RecipeRepository';
import type { IngredientSuggestion } from '../domain/ingredientSuggestion';
import { normalizeSearchTerm } from '../domain/searchTerm';

const MAX_SUGGESTIONS = 10;

export async function suggestIngredients(repo: RecipeRepository, rawPrefix: string): Promise<IngredientSuggestion[]> {
  const prefix = normalizeSearchTerm(rawPrefix);
  if (!prefix) return [];
  return repo.suggestIngredients(prefix, MAX_SUGGESTIONS);
}
