// PRESENTATION LAYER: how a recipe's readiness reads on its card and the filter chips, the Bookmarks screen's wording,
// and the labels of the bookmark buttons.
import type { BookmarkFilter } from '../../domain/bookmarks';
import type { RecipeReadiness } from '../../domain/recipeReadiness';
import { formatIngredientsOnHand } from './matchInfo';

/** The board's handwritten line beside the title. */
export const BOOKMARKS_TAGLINE = "what'chu lookin' for, fool?";

export const BOOKMARK_FILTER_LABELS: Record<BookmarkFilter, string> = {
  all: 'All',
  ready: 'Ready now',
  swap: 'Swap',
  almost: 'Almost there',
};

/** How many things a note names before it only counts the rest. */
const NAMED_IN_NOTE = 2;

export function formatReadinessLabel({ status, toBuy }: RecipeReadiness): string {
  if (status === 'ready') return 'Ready to cook';
  if (status === 'swap') return 'Swap available';
  return status === 'almost' ? '1-2 items needed' : `${toBuy.length} items needed`;
}

/** The first few pieces, joined, then "+ N more" for the others. */
function namedThenCounted(pieces: string[]): string {
  const named = pieces.slice(0, NAMED_IN_NOTE).join(', ');
  const others = pieces.length - NAMED_IN_NOTE;
  return others > 0 ? `${named} + ${others} more` : named;
}

/** The card's line under the title: "5/7 · need salmon, dill". Null when the recipe has nothing to count. */
export function formatReadinessNote({ onHandCount, neededCount, toBuy, swaps }: RecipeReadiness): string | null {
  if (neededCount === 0) return null;
  const counts = `${onHandCount}/${neededCount}`;
  if (toBuy.length > 0) {
    const names = toBuy.map(({ ingredient, kind }) => (kind === 'notEnough' ? `more ${ingredient}` : ingredient));
    return `${counts} · need ${namedThenCounted(names)}`;
  }
  if (swaps.length > 0) {
    const names = swaps.map(({ ingredient, substitute }) => `${substitute} for ${ingredient}`);
    return `${counts} · swap ${namedThenCounted(names)}`;
  }
  return formatIngredientsOnHand({ haveCount: onHandCount, neededCount });
}

/** The line under the title. `readyCount` is null when there is no pantry to check against. */
export function formatBookmarksSummary(savedCount: number, readyCount: number | null): string {
  const saved = `${savedCount} saved ${savedCount === 1 ? 'recipe' : 'recipes'}`;
  return readyCount === null ? saved : `${saved} · ${readyCount} ready to cook`;
}

export function formatBookmarkLabel(recipeName: string, saved: boolean): string {
  return saved ? `Remove ${recipeName} from bookmarks` : `Save ${recipeName}`;
}

export function formatRemovedBookmark(recipeName: string): string {
  return `Removed ${recipeName}`;
}

export function formatUndoBookmarkLabel(recipeName: string): string {
  return `Undo removing ${recipeName}`;
}
