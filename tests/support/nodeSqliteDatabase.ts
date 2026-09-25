// Test double for SqlDatabase: runs the real SQL against a SQLite file using Node's built-in
// node:sqlite, because expo-sqlite only runs on a device. Loaded with getBuiltinModule because
// Jest's module resolver does not know about node:sqlite.
import type { DatabaseSync } from 'node:sqlite';
import type { SqlDatabase, SqlParams } from '../../src/data/SqlDatabase';

const { DatabaseSync: Database } = process.getBuiltinModule('node:sqlite') as typeof import('node:sqlite');

export const RECIPES_DB_PATH = 'assets/data/recipes.db';

export function openRawRecipesDb(): DatabaseSync {
  return new Database(RECIPES_DB_PATH, { readOnly: true });
}

export function openRecipesDbForTest(): SqlDatabase {
  const db = openRawRecipesDb();
  return {
    async getAllAsync<T>(sql: string, params: SqlParams) {
      return db.prepare(sql).all(params) as T[];
    },
    async getFirstAsync<T>(sql: string, params: SqlParams) {
      return (db.prepare(sql).get(params) as T | undefined) ?? null;
    },
  };
}
