// BUSINESS LAYER: compare one recipe's lines with the user's saved pantry, for the recipe screen.
import type { PantryRepository } from '../domain/PantryRepository';
import { checkRecipeLines, type OnHand, type PantryCheck } from '../domain/pantryCheck';
import type { RecipeIngredient } from '../domain/recipe';
import type { RecipeRepository } from '../domain/RecipeRepository';
import { loadSavedPantry } from './loadSavedPantry';

/** Each line's check against what's on hand. Substitutes are resolved through the aliases first ("hamburger buns" → "hamburger bun"). */
export async function checkLinesAgainstOnHand(
  recipeRepo: RecipeRepository,
  lines: RecipeIngredient[],
  onHand: OnHand,
): Promise<Map<number, PantryCheck>> {
  const withSubstitute = lines.filter((line) => line.substitute !== null);
  const resolved = await recipeRepo.resolveIngredientNames(withSubstitute.map((line) => line.substitute as string));
  const substituteNames = new Map(withSubstitute.map((line, i) => [line.lineNumber, resolved[i]]));
  return checkRecipeLines(lines, onHand, substituteNames);
}

/**
 * Each line's check against the saved pantry, keyed by line number (see checkRecipeLines), or null when the
 * pantry is empty and there is nothing to compare with. Fails when the recipe data or the saved pantry can't be read.
 */
export async function checkRecipeAgainstPantry(
  recipeRepo: RecipeRepository,
  pantryRepo: PantryRepository,
  recipeId: number,
): Promise<Map<number, PantryCheck> | null> {
  const [lines, { pantry, seasoningsOn }] = await Promise.all([
    recipeRepo.getIngredients(recipeId),
    loadSavedPantry(pantryRepo, recipeRepo),
  ]);
  if (pantry.length === 0 && seasoningsOn.length === 0) return null;
  return checkLinesAgainstOnHand(recipeRepo, lines, { items: pantry, seasoningsOn });
}
