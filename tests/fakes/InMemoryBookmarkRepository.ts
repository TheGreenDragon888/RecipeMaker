import type { Bookmark } from '../../src/domain/bookmarks';
import type { BookmarkRepository } from '../../src/domain/BookmarkRepository';

/** Test double for BookmarkRepository. Like the table, it never hands out the same savedOrder twice. */
export class InMemoryBookmarkRepository implements BookmarkRepository {
  bookmarks: Bookmark[];
  private lastOrder: number;

  constructor(bookmarks: Bookmark[] = []) {
    this.bookmarks = bookmarks;
    this.lastOrder = Math.max(0, ...bookmarks.map((bookmark) => bookmark.savedOrder));
  }

  private has(recipeId: number) {
    return this.bookmarks.some((bookmark) => bookmark.recipeId === recipeId);
  }

  async list(): Promise<Bookmark[]> {
    return this.bookmarks;
  }

  async add(recipeId: number): Promise<void> {
    if (this.has(recipeId)) return;
    this.lastOrder += 1;
    this.bookmarks = [...this.bookmarks, { recipeId, savedOrder: this.lastOrder }];
  }

  async remove(recipeId: number): Promise<void> {
    this.bookmarks = this.bookmarks.filter((bookmark) => bookmark.recipeId !== recipeId);
  }

  async restore(bookmark: Bookmark): Promise<void> {
    if (!this.has(bookmark.recipeId)) this.bookmarks = [...this.bookmarks, bookmark];
  }
}
