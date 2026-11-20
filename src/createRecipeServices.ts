// COMPOSITION: binds the services to their repositories so the UI calls them without seeing the data layer.
import type { Bookmark } from './domain/bookmarks';
import type { BookmarkRepository } from './domain/BookmarkRepository';
import type { PantryItem } from './domain/pantry';
import type { PantryRepository } from './domain/PantryRepository';
import type { RecipeRepository } from './domain/RecipeRepository';
import { addBookmark } from './services/addBookmark';
import { checkRecipeAgainstPantry } from './services/checkRecipeAgainstPantry';
import { checkRecipesReadiness } from './services/checkRecipesReadiness';
import { filterRecipes, type RecipeFilter } from './services/filterRecipes';
import { findIngredient } from './services/findIngredient';
import { findRecipesFromPantry, type PantryRecipeFilters } from './services/findRecipesFromPantry';
import { getPantryCatalog } from './services/getPantryCatalog';
import { getRecipeDetail } from './services/getRecipeDetail';
import { getSimilarRecipes } from './services/getSimilarRecipes';
import { listAllRecipes } from './services/listAllRecipes';
import { listBookmarkIds } from './services/listBookmarkIds';
import { listBookmarks } from './services/listBookmarks';
import { loadSavedPantry } from './services/loadSavedPantry';
import { removeBookmark } from './services/removeBookmark';
import { restoreBookmark } from './services/restoreBookmark';
import { savePantry } from './services/savePantry';
import { searchRecipes } from './services/searchRecipes';
import { searchRecipesByIngredient } from './services/searchRecipesByIngredient';
import { suggestIngredients } from './services/suggestIngredients';

export type RecipeServices = ReturnType<typeof createRecipeServices>;

export function createRecipeServices(repo: RecipeRepository, pantryRepo: PantryRepository, bookmarkRepo: BookmarkRepository) {
  return {
    searchRecipesByIngredient: (raw: string) => searchRecipesByIngredient(repo, raw),
    searchRecipes: (raw: string, filter?: RecipeFilter) => searchRecipes(repo, raw, filter),
    findRecipesFromPantry: (pantryItems: string[], filters?: PantryRecipeFilters) =>
      findRecipesFromPantry(repo, pantryItems, filters),
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
    listBookmarks: () => listBookmarks(bookmarkRepo, repo),
    listBookmarkIds: () => listBookmarkIds(bookmarkRepo),
    addBookmark: (recipeId: number) => addBookmark(bookmarkRepo, recipeId),
    removeBookmark: (recipeId: number) => removeBookmark(bookmarkRepo, recipeId),
    restoreBookmark: (bookmark: Bookmark) => restoreBookmark(bookmarkRepo, bookmark),
    checkRecipesReadiness: (recipeIds: number[]) => checkRecipesReadiness(repo, pantryRepo, recipeIds),
  };
}
