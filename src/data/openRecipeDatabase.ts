// DATA ACCESS LAYER: copy the bundled recipes.db onto the device and open it.
// The only file that imports expo-sqlite. Runs on a device only, so it is verified in Expo Go
// rather than Jest; the logic it relies on (version check, queries) is tested separately.
//
// recipes.db is read-only content shipped with the app. It is overwritten on every launch so an
// app update also updates the data. Never write user data into it, and don't enable WAL on it.
import { importDatabaseFromAssetAsync, openDatabaseAsync } from 'expo-sqlite';
import { assertRecipeDataVersion } from './recipeDataVersion';
import type { SqlDatabase } from './SqlDatabase';

const RECIPES_DB_NAME = 'recipes.db';

export async function openRecipeDatabase(): Promise<SqlDatabase> {
  await importDatabaseFromAssetAsync(RECIPES_DB_NAME, {
    assetId: require('../../assets/data/recipes.db'),
    forceOverwrite: true,
  });
  const db = await openDatabaseAsync(RECIPES_DB_NAME);
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await assertRecipeDataVersion(db);
  return db;
}
