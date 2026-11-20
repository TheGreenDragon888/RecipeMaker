import { SqliteBookmarkRepository } from '../../src/data/SqliteBookmarkRepository';
import { UserDatabaseQueue } from '../../src/data/UserDatabaseQueue';
import { migrateUserDatabase } from '../../src/data/userDatabaseMigrations';
import { newestBookmarksFirst } from '../../src/domain/bookmarks';
import { openMemoryDatabaseForTest } from '../support/nodeSqliteDatabase';

/** A repository over a new, migrated user database in memory. */
function setup() {
  const { db } = openMemoryDatabaseForTest();
  return new SqliteBookmarkRepository(
    new UserDatabaseQueue(async () => {
      await migrateUserDatabase(db);
      return db;
    }),
  );
}

const newestIds = async (repo: SqliteBookmarkRepository) =>
  newestBookmarksFirst(await repo.list()).map((bookmark) => bookmark.recipeId);

describe('SqliteBookmarkRepository', () => {
  it('lists nothing when no recipe is saved', async () => {
    expect(await setup().list()).toEqual([]);
  });

  it('gives a later bookmark a higher saved order', async () => {
    const repo = setup();
    await repo.add(4);
    await repo.add(9);
    expect(await newestIds(repo)).toEqual([9, 4]);
  });

  it('keeps one bookmark when a recipe is added twice', async () => {
    const repo = setup();
    await repo.add(4);
    await repo.add(4);
    expect(await repo.list()).toHaveLength(1);
  });

  it('keeps a recipe in its place when it is added again', async () => {
    const repo = setup();
    await repo.add(4);
    await repo.add(9);
    await repo.add(4);
    expect(await newestIds(repo)).toEqual([9, 4]);
  });

  it('removes only the recipe it is given', async () => {
    const repo = setup();
    await repo.add(4);
    await repo.add(9);
    await repo.remove(4);
    expect(await newestIds(repo)).toEqual([9]);
  });

  it('does nothing when removing a recipe that is not saved', async () => {
    const repo = setup();
    await repo.add(4);
    await repo.remove(9);
    expect(await newestIds(repo)).toEqual([4]);
  });

  it('restores a removed recipe to its old place', async () => {
    const repo = setup();
    await repo.add(1);
    await repo.add(2);
    await repo.add(3);
    const middle = (await repo.list()).find((bookmark) => bookmark.recipeId === 2)!;
    await repo.remove(2);
    await repo.restore(middle);
    expect(await newestIds(repo)).toEqual([3, 2, 1]);
  });

  it('never reuses the place of a removed bookmark', async () => {
    const repo = setup();
    await repo.add(1);
    const removed = (await repo.list())[0];
    await repo.remove(1);
    await repo.add(2);
    await repo.restore(removed);
    expect(await newestIds(repo)).toEqual([2, 1]);
  });

  it('leaves a saved recipe as it is when restoring it', async () => {
    const repo = setup();
    await repo.add(4);
    const [saved] = await repo.list();
    await repo.restore({ recipeId: 4, savedOrder: 99 });
    expect(await repo.list()).toEqual([saved]);
  });

  it('fails when the database cannot be opened', async () => {
    const repo = new SqliteBookmarkRepository(new UserDatabaseQueue(() => Promise.reject(new Error('corrupt'))));
    await expect(repo.list()).rejects.toThrow('corrupt');
  });
});
