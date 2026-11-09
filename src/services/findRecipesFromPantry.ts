// BUSINESS LAYER: "What can I make?" — rank by pantry matches, closeness, then name.
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

export type PantryRecipeFilters = {
  servingRange?: { min: number; max: number };
  maxActiveMinutes?: number;
  mealPrepOnly?: boolean;
};

const MAX_RESULTS = 20;

export async function findRecipesFromPantry(
  repo: RecipeRepository,
  pantryItems: string[],
  filters?: PantryRecipeFilters,
): Promise<PantryMatch[]> {
  const terms = pantryItems.map(normalizeSearchTerm).filter(Boolean);
  if (terms.length === 0) return [];
  const servingRange = filters?.servingRange;
  const maxActiveMinutes = filters?.maxActiveMinutes;
  if (
    servingRange &&
    (!Number.isInteger(servingRange.min) ||
      !Number.isInteger(servingRange.max) ||
      servingRange.min < 1 ||
      servingRange.max < servingRange.min)
  ) {
    throw new RangeError('The serving range must be positive whole numbers with minimum at most maximum.');
  }
  if (maxActiveMinutes !== undefined && (!Number.isInteger(maxActiveMinutes) || maxActiveMinutes < 1)) {
    throw new RangeError('Maximum active time must be a positive whole number of minutes.');
  }

  // Ingredient names are compared case-insensitively ("Parmesan cheese" = "parmesan cheese").
  const pantry = new Set((await repo.resolveIngredientNames(terms)).map((n) => n.toLowerCase()));
  const staples = new Set(STAPLES);
  const mealPrepIds = filters?.mealPrepOnly ? new Set(await repo.listRecipeIdsByTag('Meal Prep')) : null;

  const needed = new Map<number, Set<string>>();
  for (const use of await repo.listIngredientUsage()) {
    const name = use.ingredient.toLowerCase();
    if (use.isOptional || staples.has(name)) continue;
    if (!needed.has(use.recipeId)) needed.set(use.recipeId, new Set());
    needed.get(use.recipeId)!.add(name);
  }

  const matches: PantryMatch[] = [];
  for (const recipe of await repo.listRecipeSummaries()) {
    if (
      (servingRange && (recipe.servingsMin > servingRange.max || recipe.servingsMax < servingRange.min)) ||
      (maxActiveMinutes !== undefined && recipe.activeTimeMinutes > maxActiveMinutes) ||
      (mealPrepIds && !mealPrepIds.has(recipe.id))
    ) {
      continue;
    }
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
        b.haveCount - a.haveCount ||
        b.haveCount * a.neededCount - a.haveCount * b.neededCount ||
        a.recipe.name.localeCompare(b.recipe.name),
    )
    .slice(0, MAX_RESULTS);
}
