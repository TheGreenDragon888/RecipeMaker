import {
  migrateUserDatabase,
  USER_DATA_VERSION,
  UserDataVersionError,
} from '../../src/data/userDatabaseMigrations';
import { openMemoryDatabaseForTest } from '../support/nodeSqliteDatabase';

const versionOf = (raw: ReturnType<typeof openMemoryDatabaseForTest>['raw']) =>
  (raw.prepare('PRAGMA user_version;').get() as { user_version: number }).user_version;

const tablesOf = (raw: ReturnType<typeof openMemoryDatabaseForTest>['raw']) =>
  (raw.prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name").all() as { name: string }[]).map(
    (row) => row.name,
  );

describe('migrateUserDatabase', () => {
  it('creates the user tables in a new database', async () => {
    const { db, raw } = openMemoryDatabaseForTest();
    await migrateUserDatabase(db);
    // sqlite_sequence is SQLite's own record of the numbers AUTOINCREMENT has handed out.
    expect(tablesOf(raw)).toEqual(['bookmarks', 'pantry_items', 'seasonings_on', 'sqlite_sequence']);
  });

  describe('upgrading a database from version 1', () => {
    /** user.db as the first release left it, with one pantry item saved. */
    function versionOneDatabase() {
      const opened = openMemoryDatabaseForTest();
      opened.raw.exec(`
        CREATE TABLE pantry_items (
          ingredient TEXT PRIMARY KEY COLLATE NOCASE, position INTEGER NOT NULL, quantity REAL NOT NULL,
          unit TEXT, shown_unit TEXT
        );
        CREATE TABLE seasonings_on (ingredient TEXT PRIMARY KEY COLLATE NOCASE, position INTEGER NOT NULL);
        INSERT INTO pantry_items (ingredient, position, quantity, unit) VALUES ('garlic', 0, 3, 'clove');
        PRAGMA user_version = 1;
      `);
      return opened;
    }

    it('adds the bookmarks table', async () => {
      const { db, raw } = versionOneDatabase();
      await migrateUserDatabase(db);
      expect(tablesOf(raw)).toContain('bookmarks');
    });

    it('keeps the saved pantry', async () => {
      const { db, raw } = versionOneDatabase();
      await migrateUserDatabase(db);
      expect(raw.prepare('SELECT ingredient, quantity FROM pantry_items').all()).toEqual([{ ingredient: 'garlic', quantity: 3 }]);
    });

    it('raises user_version to the current version', async () => {
      const { db, raw } = versionOneDatabase();
      await migrateUserDatabase(db);
      expect(versionOf(raw)).toBe(USER_DATA_VERSION);
    });
  });

  it("sets a new database's user_version to the version this code expects", async () => {
    const { db, raw } = openMemoryDatabaseForTest();
    await migrateUserDatabase(db);
    expect(versionOf(raw)).toBe(USER_DATA_VERSION);
  });

  it('changes nothing in a database that is already up to date', async () => {
    const { db, raw } = openMemoryDatabaseForTest();
    await migrateUserDatabase(db);
    raw.exec("INSERT INTO seasonings_on (ingredient, position) VALUES ('paprika', 0)");

    await migrateUserDatabase(db);

    expect(raw.prepare('SELECT ingredient FROM seasonings_on').all()).toEqual([{ ingredient: 'paprika' }]);
  });

  it('throws UserDataVersionError for a database newer than this code, rather than guess at its tables', async () => {
    const { db, raw } = openMemoryDatabaseForTest();
    raw.exec(`PRAGMA user_version = ${USER_DATA_VERSION + 1};`);
    await expect(migrateUserDatabase(db)).rejects.toThrow(UserDataVersionError);
  });
});
