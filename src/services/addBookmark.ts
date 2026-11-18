// BUSINESS LAYER: save a recipe.
import type { BookmarkRepository } from '../domain/BookmarkRepository';

export function addBookmark(repo: BookmarkRepository, recipeId: number): Promise<void> {
  return repo.add(recipeId);
}
