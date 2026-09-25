// DATA ACCESS LAYER: the subset of expo-sqlite's SQLiteDatabase that repositories use.
// Depending on this instead of SQLiteDatabase lets integration tests run the same SQL on
// Node's built-in SQLite. expo-sqlite's SQLiteDatabase satisfies it as-is.

export type SqlParams = Record<string, string | number | null>;

export interface SqlDatabase {
  getAllAsync<T>(sql: string, params: SqlParams): Promise<T[]>;
  getFirstAsync<T>(sql: string, params: SqlParams): Promise<T | null>;
}
