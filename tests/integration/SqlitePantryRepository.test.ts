import { SqlitePantryRepository } from '../../src/data/SqlitePantryRepository';
import { migrateUserDatabase } from '../../src/data/userDatabaseMigrations';
import type { SavedPantry } from '../../src/domain/savedPantry';
import { openMemoryDatabaseForTest } from '../support/nodeSqliteDatabase';

/** A repository over a new, migrated user database in memory, and a count of how often it was opened. */
function setup() {
  const { db } = openMemoryDatabaseForTest();
  const open = jest.fn(async () => {
    await migrateUserDatabase(db);
    return db;
  });
  return { repo: new SqlitePantryRepository(open), open };
}

const pantry = (items: SavedPantry['items'], seasoningsOn: string[] = []): SavedPantry => ({ items, seasoningsOn });

describe('SqlitePantryRepository', () => {
  it('loads an empty pantry when nothing has been saved', async () => {
    const { repo } = setup();
    expect(await repo.load()).toEqual(pantry([]));
  });

  it('loads what was saved, in order', async () => {
    const { repo } = setup();
    const saved = pantry(
      [
        { name: 'milk', quantity: 2, unit: 'cup' },
        { name: 'garlic', quantity: 3, unit: 'clove' },
      ],
      ['paprika', 'cumin'],
    );
    await repo.save(saved);
    expect(await repo.load()).toEqual(saved);
  });

  it('keeps a fraction, a missing unit and a shown unit as they were saved', async () => {
    const { repo } = setup();
    const saved = pantry([
      { name: 'milk', quantity: 2.0625, unit: 'cup', shownUnit: 'tbsp' },
      { name: 'dragon fruit', quantity: 1, unit: null },
    ]);
    await repo.save(saved);
    expect(await repo.load()).toEqual(saved);
  });

  it('replaces the earlier save', async () => {
    const { repo } = setup();
    await repo.save(pantry([{ name: 'milk', quantity: 2, unit: 'cup' }], ['paprika']));
    await repo.save(pantry([{ name: 'garlic', quantity: 1, unit: 'clove' }]));
    expect(await repo.load()).toEqual(pantry([{ name: 'garlic', quantity: 1, unit: 'clove' }]));
  });

  it('ends with the later of two saves started together', async () => {
    const { repo } = setup();
    await Promise.all([
      repo.save(pantry([{ name: 'milk', quantity: 1, unit: 'cup' }])),
      repo.save(pantry([{ name: 'milk', quantity: 2, unit: 'cup' }])),
    ]);
    expect(await repo.load()).toEqual(pantry([{ name: 'milk', quantity: 2, unit: 'cup' }]));
  });

  it('keeps the earlier save when a save fails partway', async () => {
    const { repo } = setup();
    await repo.save(pantry([{ name: 'milk', quantity: 2, unit: 'cup' }]));
    // The same name twice breaks the table's key on the second row, after the first was written.
    const broken = pantry([
      { name: 'garlic', quantity: 1, unit: 'clove' },
      { name: 'Garlic', quantity: 2, unit: 'clove' },
    ]);
    await expect(repo.save(broken)).rejects.toThrow();
    expect(await repo.load()).toEqual(pantry([{ name: 'milk', quantity: 2, unit: 'cup' }]));
  });

  it('still saves after an earlier save failed', async () => {
    const { repo } = setup();
    const broken = pantry([
      { name: 'garlic', quantity: 1, unit: 'clove' },
      { name: 'Garlic', quantity: 2, unit: 'clove' },
    ]);
    await expect(repo.save(broken)).rejects.toThrow();
    await repo.save(pantry([], ['paprika']));
    expect(await repo.load()).toEqual(pantry([], ['paprika']));
  });

  it('opens the database only once', async () => {
    const { repo, open } = setup();
    await repo.load();
    await repo.save(pantry([]));
    await repo.save(pantry([]));
    expect(open).toHaveBeenCalledTimes(1);
  });

  describe("when the database can't be opened", () => {
    const failing = () => new SqlitePantryRepository(() => Promise.reject(new Error('corrupt')));

    it('fails to load', async () => {
      await expect(failing().load()).rejects.toThrow('corrupt');
    });

    it('fails to save', async () => {
      await expect(failing().save(pantry([]))).rejects.toThrow('corrupt');
    });
  });
});
