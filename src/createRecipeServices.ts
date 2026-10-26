// COMPOSITION: binds the services to their repositories so the UI calls them without seeing the data layer.
import type { PantryItem } from './domain/pantry';
import type { PantryRepository } from './domain/PantryRepository';
import type { RecipeRepository } from './domain/RecipeRepository';
import { checkRecipeAgainstPantry } from './services/checkRecipeAgainstPantry';
import { filterRecipes, type RecipeFilter } from './services/filterRecipes';
import { findIngredient } from './services/findIngredient';
import { findRecipesFromPantry } from './services/findRecipesFromPantry';
import { getPantryCatalog } from './services/getPantryCatalog';
import { getRecipeDetail } from './services/getRecipeDetail';
import { getSimilarRecipes } from './services/getSimilarRecipes';
import { listAllRecipes } from './services/listAllRecipes';
import { loadSavedPantry } from './services/loadSavedPantry';
import { savePantry } from './services/savePantry';
import { searchRecipesByIngredient } from './services/searchRecipesByIngredient';
import { suggestIngredients } from './services/suggestIngredients';

export type RecipeServices = ReturnType<typeof createRecipeServices>;

export function createRecipeServices(repo: RecipeRepository, pantryRepo: PantryRepository) {
  return {
    searchRecipesByIngredient: (raw: string) => searchRecipesByIngredient(repo, raw),
    findRecipesFromPantry: (pantryItems: string[]) => findRecipesFromPantry(repo, pantryItems),
    filterRecipes: (filter: RecipeFilter) => filterRecipes(repo, filter),
    getRecipeDetail: (recipeId: number) => getRecipeDetail(repo, recipeId),
    getSimilarRecipes: (recipeId: number) => getSimilarRecipes(repo, recipeId),
    suggestIngredients: (prefix: string) => suggestIngredients(repo, prefix),
    findIngredient: (raw: string) => findIngredient(repo, raw),
    listAllRecipes: () => listAllRecipes(repo),
    getPantryCatalog: () => getPantryCatalog(repo),
    loadSavedPantry: () => loadSavedPantry(pantryRepo, repo),
    savePantry: (pantry: PantryItem[], seasoningsOn: string[]) => savePantry(pantryRepo, pantry, seasoningsOn),
    checkRecipeAgainstPantry: (recipeId: number) => checkRecipeAgainstPantry(repo, pantryRepo, recipeId),
  };
}
