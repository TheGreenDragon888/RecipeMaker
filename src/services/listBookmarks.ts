// BUSINESS LAYER: the recipes the user saved, newest first.
import type { BookmarkRepository } from '../domain/BookmarkRepository';
import { newestBookmarksFirst, type SavedRecipe } from '../domain/bookmarks';
import type { RecipeRepository } from '../domain/RecipeRepository';

/** A bookmark whose recipe is no longer in the recipe data is left out. */
export async function listBookmarks(bookmarkRepo: BookmarkRepository, recipeRepo: RecipeRepository): Promise<SavedRecipe[]> {
  const [bookmarks, summaries] = await Promise.all([bookmarkRepo.list(), recipeRepo.listRecipeSummaries()]);
  const recipes = new Map(summaries.map((recipe) => [recipe.id, recipe]));
  return newestBookmarksFirst(bookmarks).flatMap(({ recipeId, savedOrder }) => {
    const recipe = recipes.get(recipeId);
    return recipe ? [{ recipe, savedOrder }] : [];
  });
}
