// BUSINESS LAYER: the same dish from other sources ("Similar recipes").
import type { RecipeRepository } from '../domain/RecipeRepository';
import type { RecipeSummary } from '../domain/recipe';

export async function getSimilarRecipes(repo: RecipeRepository, recipeId: number): Promise<RecipeSummary[]> {
  const recipe = await repo.getRecipe(recipeId);
  if (!recipe?.duplicateGroup) return [];
  const group = await repo.findByDuplicateGroup(recipe.duplicateGroup);
  return group.filter((r) => r.id !== recipeId);
}
