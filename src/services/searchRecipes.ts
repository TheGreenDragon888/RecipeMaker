// BUSINESS LAYER: search recipes by title first, then by ingredient.
import type { RecipeRepository } from '../domain/RecipeRepository';
import type { RecipeSummary } from '../domain/recipe';
import { normalizeSearchTerm } from '../domain/searchTerm';
import { filterRecipes, type RecipeFilter } from './filterRecipes';

/** Returns alphabetized title matches followed by alphabetized ingredient matches, without duplicates. */
export async function searchRecipes(
  repo: RecipeRepository,
  raw: string,
  filter?: RecipeFilter,
): Promise<RecipeSummary[]> {
  const term = normalizeSearchTerm(raw);
  if (!term) return [];

  const [recipes, ingredientMatches, filtered] = await Promise.all([
    repo.listRecipeSummaries(),
    repo.findByIngredientOrAliasContaining(term),
    filter ? filterRecipes(repo, filter) : Promise.resolve(null),
  ]);
  const allowedIds = filtered ? new Set(filtered.map((recipe) => recipe.id)) : null;
  const titleMatches = recipes
    .filter((recipe) => normalizeSearchTerm(recipe.name).includes(term) && (!allowedIds || allowedIds.has(recipe.id)))
    .sort((a, b) => a.name.localeCompare(b.name));
  const titleIds = new Set(titleMatches.map((recipe) => recipe.id));
  const remainingIngredientMatches = ingredientMatches
    .filter((recipe) => !titleIds.has(recipe.id) && (!allowedIds || allowedIds.has(recipe.id)))
    .sort((a, b) => a.name.localeCompare(b.name));

  return [...titleMatches, ...remainingIngredientMatches];
}
