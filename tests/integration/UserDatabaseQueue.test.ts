import { SqliteBookmarkRepository } from '../../src/data/SqliteBookmarkRepository';
import { SqlitePantryRepository } from '../../src/data/SqlitePantryRepository';
import { UserDatabaseQueue } from '../../src/data/UserDatabaseQueue';
import { migrateUserDatabase } from '../../src/data/userDatabaseMigrations';
import { openMemoryDatabaseForTest } from '../support/nodeSqliteDatabase';

function setup() {
  const { db } = openMemoryDatabaseForTest();
  const open = jest.fn(async () => {
    await migrateUserDatabase(db);
    return db;
  });
  return { queue: new UserDatabaseQueue(open), open, db };
}

describe('UserDatabaseQueue', () => {
  it('opens the database once for every task', async () => {
    const { queue, open } = setup();
    await queue.inTurn(async () => undefined);
    await queue.inTurn(async () => undefined);
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('does not open the database until a task needs it', () => {
    const { open } = setup();
    expect(open).not.toHaveBeenCalled();
  });

  it('gives a task its result back', async () => {
    const { queue } = setup();
    expect(await queue.inTurn(async () => 7)).toBe(7);
  });

  it('runs a task only after the one before it has finished', async () => {
    const { queue } = setup();
    const events: string[] = [];
    let finishFirst!: () => void;
    const first = queue.inTurn(async () => {
      events.push('first starts');
      await new Promise<void>((resolve) => {
        finishFirst = resolve;
      });
      events.push('first ends');
    });
    const second = queue.inTurn(async () => {
      events.push('second starts');
    });
    await new Promise((resolve) => setImmediate(resolve));
    finishFirst();
    await Promise.all([first, second]);
    expect(events).toEqual(['first starts', 'first ends', 'second starts']);
  });

  it('still runs a task after the one before it failed', async () => {
    const { queue } = setup();
    await expect(queue.inTurn(() => Promise.reject(new Error('broken')))).rejects.toThrow('broken');
    expect(await queue.inTurn(async () => 'ran')).toBe('ran');
  });

  it('lets the pantry and bookmark repositories share one database', async () => {
    const { queue, open } = setup();
    const pantry = new SqlitePantryRepository(queue);
    const bookmarks = new SqliteBookmarkRepository(queue);
    await Promise.all([pantry.save({ items: [], seasoningsOn: ['paprika'] }), bookmarks.add(4)]);
    expect([(await pantry.load()).seasoningsOn, (await bookmarks.list()).length, open.mock.calls.length]).toEqual([
      ['paprika'],
      1,
      1,
    ]);
  });
});
