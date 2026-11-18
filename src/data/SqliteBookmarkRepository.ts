// DATA ACCESS LAYER: keeps the user's saved recipes in user.db. Plain reads and writes; the order they're listed in
// is decided in src/domain/bookmarks.ts.
import type { Bookmark } from '../domain/bookmarks';
import type { BookmarkRepository } from '../domain/BookmarkRepository';
import type { UserDatabaseQueue } from './UserDatabaseQueue';

const LIST_SQL = 'SELECT saved_order, recipe_id FROM bookmarks';
const ADD_SQL = 'INSERT OR IGNORE INTO bookmarks (recipe_id) VALUES ($recipeId)';
const REMOVE_SQL = 'DELETE FROM bookmarks WHERE recipe_id = $recipeId';
const RESTORE_SQL = 'INSERT OR IGNORE INTO bookmarks (saved_order, recipe_id) VALUES ($savedOrder, $recipeId)';

type BookmarkRow = { saved_order: number; recipe_id: number };

function toBookmark(row: BookmarkRow): Bookmark {
  return { recipeId: row.recipe_id, savedOrder: row.saved_order };
}

export class SqliteBookmarkRepository implements BookmarkRepository {
  constructor(private readonly queue: UserDatabaseQueue) {}

  list(): Promise<Bookmark[]> {
    return this.queue.inTurn(async (db) => (await db.getAllAsync<BookmarkRow>(LIST_SQL, {})).map(toBookmark));
  }

  add(recipeId: number): Promise<void> {
    return this.queue.inTurn(async (db) => {
      await db.runAsync(ADD_SQL, { $recipeId: recipeId });
    });
  }

  remove(recipeId: number): Promise<void> {
    return this.queue.inTurn(async (db) => {
      await db.runAsync(REMOVE_SQL, { $recipeId: recipeId });
    });
  }

  restore({ recipeId, savedOrder }: Bookmark): Promise<void> {
    return this.queue.inTurn(async (db) => {
      await db.runAsync(RESTORE_SQL, { $savedOrder: savedOrder, $recipeId: recipeId });
    });
  }
}
