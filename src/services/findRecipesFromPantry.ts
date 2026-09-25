// BUSINESS LAYER: "What can I make?" — rank recipes by how few ingredients the user is missing.
import type { RecipeRepository } from '../domain/RecipeRepository';
import type { RecipeSummary } from '../domain/recipe';
import { normalizeSearchTerm } from '../domain/searchTerm';
import { STAPLES } from '../domain/staples';

export type PantryMatch = {
  recipe: RecipeSummary;
  /** Distinct required ingredients, excluding optional ones and staples. */
  neededCount: number;
  haveCount: number;
  missingCount: number;
};

const MAX_RESULTS = 20;

export async function findRecipesFromPantry(
  repo: RecipeRepository,
  pantryItems: string[],
): Promise<PantryMatch[]> {
  const terms = pantryItems.map(normalizeSearchTerm).filter(Boolean);
  if (terms.length === 0) return [];

  // Ingredient names are compared case-insensitively ("Parmesan cheese" = "parmesan cheese").
  const pantry = new Set((await repo.resolveIngredientNames(terms)).map((n) => n.toLowerCase()));
  const staples = new Set(STAPLES);

  const needed = new Map<number, Set<string>>();
  for (const use of await repo.listIngredientUsage()) {
    const name = use.ingredient.toLowerCase();
    if (use.isOptional || staples.has(name)) continue;
    if (!needed.has(use.recipeId)) needed.set(use.recipeId, new Set());
    needed.get(use.recipeId)!.add(name);
  }

  const matches: PantryMatch[] = [];
  for (const recipe of await repo.listRecipeSummaries()) {
    const ingredients = [...(needed.get(recipe.id) ?? [])];
    const haveCount = ingredients.filter((i) => pantry.has(i)).length;
    if (haveCount === 0) continue;
    matches.push({
      recipe,
      neededCount: ingredients.length,
      haveCount,
      missingCount: ingredients.length - haveCount,
    });
  }

  return matches
    .sort(
      (a, b) =>
        a.missingCount - b.missingCount ||
        b.haveCount - a.haveCount ||
        a.recipe.activeTimeMinutes - b.recipe.activeTimeMinutes ||
        a.recipe.name.localeCompare(b.recipe.name),
    )
    .slice(0, MAX_RESULTS);
}
