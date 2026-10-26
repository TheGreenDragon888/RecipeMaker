// DATA ACCESS LAYER: open the user's own database (user.db) on the device, creating it on the first launch.
// With openRecipeDatabase.ts, the only files that import expo-sqlite. Runs on a device only, so it is verified in
// Expo Go; the migrations and the repository that use it are tested separately.
//
// Unlike recipes.db, user.db is never replaced: it holds what the user saved, so it is brought up to date by
// migrateUserDatabase instead.
import { openDatabaseAsync } from 'expo-sqlite';
import type { WritableSqlDatabase } from './SqlDatabase';
import { migrateUserDatabase } from './userDatabaseMigrations';

const USER_DB_NAME = 'user.db';

export async function openUserDatabase(): Promise<WritableSqlDatabase> {
  const db = await openDatabaseAsync(USER_DB_NAME);
  await migrateUserDatabase(db);
  return db;
}
