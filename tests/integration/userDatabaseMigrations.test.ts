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
  it('creates the pantry tables in a new database', async () => {
    const { db, raw } = openMemoryDatabaseForTest();
    await migrateUserDatabase(db);
    expect(tablesOf(raw)).toEqual(['pantry_items', 'seasonings_on']);
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
