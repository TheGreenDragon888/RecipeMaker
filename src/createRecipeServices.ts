// COMPOSITION: binds the services to a repository so the UI calls them without seeing the data layer.
import type { RecipeRepository } from './domain/RecipeRepository';
import { filterRecipes, type RecipeFilter } from './services/filterRecipes';
import { findRecipesFromPantry } from './services/findRecipesFromPantry';
import { getRecipeDetail } from './services/getRecipeDetail';
import { getSimilarRecipes } from './services/getSimilarRecipes';
import { searchRecipesByIngredient } from './services/searchRecipesByIngredient';
import { suggestIngredients } from './services/suggestIngredients';

export type RecipeServices = ReturnType<typeof createRecipeServices>;

export function createRecipeServices(repo: RecipeRepository) {
  return {
    searchRecipesByIngredient: (raw: string) => searchRecipesByIngredient(repo, raw),
    findRecipesFromPantry: (pantryItems: string[]) => findRecipesFromPantry(repo, pantryItems),
    filterRecipes: (filter: RecipeFilter) => filterRecipes(repo, filter),
    getRecipeDetail: (recipeId: number) => getRecipeDetail(repo, recipeId),
    getSimilarRecipes: (recipeId: number) => getSimilarRecipes(repo, recipeId),
    suggestIngredients: (prefix: string) => suggestIngredients(repo, prefix),
  };
}
