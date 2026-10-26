// DATA ACCESS LAYER: the subset of expo-sqlite's SQLiteDatabase that repositories use.
// Depending on this instead of SQLiteDatabase lets integration tests run the same SQL on
// Node's built-in SQLite. expo-sqlite's SQLiteDatabase satisfies it as-is.

export type SqlParams = Record<string, string | number | null>;

export interface SqlDatabase {
  getAllAsync<T>(sql: string, params: SqlParams): Promise<T[]>;
  getFirstAsync<T>(sql: string, params: SqlParams): Promise<T | null>;
}

/**
 * A database the app writes to (user.db). Kept apart from SqlDatabase so the recipe repository, which reads the
 * read-only recipes.db, can't write. expo-sqlite's SQLiteDatabase satisfies this too.
 */
export interface WritableSqlDatabase extends SqlDatabase {
  runAsync(sql: string, params: SqlParams): Promise<unknown>;
  execAsync(sql: string): Promise<void>;
  /** Runs the task in a transaction: all of its writes happen, or none if it throws. */
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}
