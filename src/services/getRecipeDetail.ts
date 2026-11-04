// BUSINESS LAYER: everything a recipe screen needs.
import { RecipeNotFoundError } from '../domain/errors';
import type { RecipeRepository } from '../domain/RecipeRepository';
import type { Recipe, RecipeIngredient } from '../domain/recipe';

export type RecipeDetail = {
  recipe: Recipe;
  ingredients: RecipeIngredient[];
  /** The on/off ingredients (seasonings and staples) the recipe uses, so the screen can list them first. */
  seasonings: string[];
};

export async function getRecipeDetail(repo: RecipeRepository, recipeId: number): Promise<RecipeDetail> {
  const recipe = await repo.getRecipe(recipeId);
  if (!recipe) throw new RecipeNotFoundError(recipeId);
  const [ingredients, tracking] = await Promise.all([repo.getIngredients(recipeId), repo.listPantryTracking()]);
  const used = new Set(ingredients.map((line) => line.ingredient.toLowerCase()));
  const seasonings = tracking
    .filter((row) => row.tracking === 'presence' && used.has(row.ingredient.toLowerCase()))
    .map((row) => row.ingredient);
  return { recipe, ingredients, seasonings };
}
