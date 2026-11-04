// BUSINESS LAYER: ingredient autocomplete.
import type { RecipeRepository } from '../domain/RecipeRepository';
import type { IngredientSuggestion } from '../domain/ingredientSuggestion';
import { normalizeSearchTerm } from '../domain/searchTerm';

const MAX_SUGGESTIONS = 10;

/**
 * Where a match was found, best first: a name starting with the text, an alias starting with it, a name
 * containing it, then an alias containing it.
 */
function tier(match: IngredientSuggestion, text: string): number {
  const matched = (match.matchedAlias ?? match.ingredient).toLowerCase();
  return (matched.startsWith(text) ? 0 : 2) + (match.matchedAlias === null ? 0 : 1);
}

/** A to Z, ignoring capitals; code-point order, so it is the same on every phone. */
function compareText(a: string, b: string): number {
  const [x, y] = [a.toLowerCase(), b.toLowerCase()];
  return x < y ? -1 : x > y ? 1 : 0;
}

/**
 * Up to 10 ingredients whose name or alias contains the typed text, each once, by its best match: ranked by
 * tier (see above), then A to Z by ingredient, then by alias.
 */
export async function suggestIngredients(repo: RecipeRepository, rawPrefix: string): Promise<IngredientSuggestion[]> {
  const text = normalizeSearchTerm(rawPrefix);
  if (!text) return [];

  const ranked = (await repo.findIngredientMatches(text))
    .map((match) => ({ match, tier: tier(match, text) }))
    .sort(
      (a, b) =>
        a.tier - b.tier ||
        compareText(a.match.ingredient, b.match.ingredient) ||
        compareText(a.match.matchedAlias ?? '', b.match.matchedAlias ?? ''),
    );

  // The first match of each ingredient is its best.
  const best = new Map<string, IngredientSuggestion>();
  for (const { match } of ranked) {
    const key = match.ingredient.toLowerCase();
    if (!best.has(key)) best.set(key, match);
  }
  return [...best.values()].slice(0, MAX_SUGGESTIONS);
}
