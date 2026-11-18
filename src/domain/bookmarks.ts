// BUSINESS LAYER: saved recipes, the order they're listed in, and how the Bookmarks screen's search and filter
// chips pick from them.
import type { RecipeSummary } from './recipe';
import {
  countByReadinessFilter,
  matchesReadinessFilter,
  type ReadinessById,
  type ReadinessFilter,
} from './recipeReadiness';
import { normalizeSearchTerm } from './searchTerm';

/** A saved recipe. `savedOrder` is higher the later it was saved, and no two bookmarks ever share one. */
export type Bookmark = { recipeId: number; savedOrder: number };

/** A saved recipe with what the list shows of it. */
export type SavedRecipe = { recipe: RecipeSummary; savedOrder: number };

export type BookmarkFilter = ReadinessFilter;

export type BookmarkSelection = {
  filter: BookmarkFilter;
  query: string;
  /** Each recipe's readiness; null when there is no pantry to check against, which leaves only All. */
  readiness: ReadinessById | null;
};

export function newestBookmarksFirst<T extends { savedOrder: number }>(bookmarks: readonly T[]): T[] {
  return [...bookmarks].sort((a, b) => b.savedOrder - a.savedOrder);
}

/** The saved recipes that fit the search and the filter, in the order given. */
export function selectBookmarks(saved: readonly SavedRecipe[], { filter, query, readiness }: BookmarkSelection): SavedRecipe[] {
  const term = normalizeSearchTerm(query);
  return saved.filter(({ recipe }) => {
    if (term && !normalizeSearchTerm(recipe.name).includes(term)) return false;
    return matchesReadinessFilter(recipe.id, filter, readiness);
  });
}

/** How many saved recipes each filter holds. The search doesn't change these. */
export function countBookmarksByFilter(
  saved: readonly SavedRecipe[],
  readiness: ReadinessById | null,
): Record<BookmarkFilter, number> {
  return countByReadinessFilter(saved, readiness);
}
