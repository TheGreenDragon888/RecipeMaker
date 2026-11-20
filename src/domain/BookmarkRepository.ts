// BUSINESS LAYER: the contract services use to keep the user's saved recipes. Implemented in src/data/.
import type { Bookmark } from './bookmarks';

export interface BookmarkRepository {
  /** Every saved recipe, in no particular order. */
  list(): Promise<Bookmark[]>;
  /** Saves the recipe as the newest bookmark. Does nothing if it is already saved. */
  add(recipeId: number): Promise<void>;
  /** Does nothing if the recipe isn't saved. */
  remove(recipeId: number): Promise<void>;
  /** Saves the recipe again with the place it had. Does nothing if it is already saved. */
  restore(bookmark: Bookmark): Promise<void>;
}
