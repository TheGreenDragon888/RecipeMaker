// DATA ACCESS LAYER: the user database's tables, and the steps that bring an older copy on the phone up to date.
// Unlike recipes.db, user.db can't be replaced by a new copy (it holds what the user saved), so each change to its
// tables is a new step at the end of MIGRATIONS. Never edit a step that has shipped; add another one.
import type { WritableSqlDatabase } from './SqlDatabase';

/** Step n (counting from 1) takes the database from user_version n - 1 to n. */
const MIGRATIONS: readonly string[] = [
  // 1: the pantry list and the seasonings that are on. Ingredients are stored by their name in recipes.db.
  `CREATE TABLE pantry_items (
     ingredient  TEXT    PRIMARY KEY COLLATE NOCASE,
     position    INTEGER NOT NULL,  -- order in the list
     quantity    REAL    NOT NULL,  -- in unit; can be a fraction
     unit        TEXT,              -- the pantry unit when saved; NULL if it wasn't known
     shown_unit  TEXT               -- the unit picked in the amount sheet; NULL while that is the pantry unit
   );
   CREATE TABLE seasonings_on (
     ingredient  TEXT    PRIMARY KEY COLLATE NOCASE,
     position    INTEGER NOT NULL
   );`,
];

/** The user_version a fully migrated user.db has. */
export const USER_DATA_VERSION = MIGRATIONS.length;

/** user.db is newer than this code knows, as after going back to an older version of the app. */
export class UserDataVersionError extends Error {
  constructor(public readonly found: number) {
    super(`user.db data version ${found} is newer than ${USER_DATA_VERSION}`);
    this.name = 'UserDataVersionError';
  }
}

/** Runs the steps the database hasn't had yet, each in its own transaction with its new version number. */
export async function migrateUserDatabase(db: WritableSqlDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;', {});
  const found = row?.user_version ?? 0;
  if (found > USER_DATA_VERSION) throw new UserDataVersionError(found);
  for (let version = found; version < USER_DATA_VERSION; version += 1) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[version]);
      await db.execAsync(`PRAGMA user_version = ${version + 1};`);
    });
  }
}
