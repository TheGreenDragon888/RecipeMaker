// BUSINESS LAYER: Undo for a removed bookmark: the recipe comes back in its old place.
import type { Bookmark } from '../domain/bookmarks';
import type { BookmarkRepository } from '../domain/BookmarkRepository';

export function restoreBookmark(repo: BookmarkRepository, bookmark: Bookmark): Promise<void> {
  return repo.restore(bookmark);
}
