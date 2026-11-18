// BUSINESS LAYER: stop saving a recipe.
import type { BookmarkRepository } from '../domain/BookmarkRepository';

export function removeBookmark(repo: BookmarkRepository, recipeId: number): Promise<void> {
  return repo.remove(recipeId);
}
