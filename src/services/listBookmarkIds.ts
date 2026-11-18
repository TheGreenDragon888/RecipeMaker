// BUSINESS LAYER: which recipes are saved, for the bookmark buttons on other screens.
import type { BookmarkRepository } from '../domain/BookmarkRepository';

export async function listBookmarkIds(repo: BookmarkRepository): Promise<number[]> {
  return (await repo.list()).map((bookmark) => bookmark.recipeId);
}
