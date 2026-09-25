// BUSINESS LAYER: everything a recipe screen needs.
import { RecipeNotFoundError } from '../domain/errors';
import type { RecipeRepository } from '../domain/RecipeRepository';
import type { Recipe, RecipeIngredient } from '../domain/recipe';

export type RecipeDetail = {
  recipe: Recipe;
  ingredients: RecipeIngredient[];
};

export async function getRecipeDetail(repo: RecipeRepository, recipeId: number): Promise<RecipeDetail> {
  const recipe = await repo.getRecipe(recipeId);
  if (!recipe) throw new RecipeNotFoundError(recipeId);
  const ingredients = await repo.getIngredients(recipeId);
  return { recipe, ingredients };
}
