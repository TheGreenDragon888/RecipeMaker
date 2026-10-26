// DATA ACCESS LAYER: keeps the user's pantry in user.db. Plain reads and writes; the rules for fitting a saved
// pantry to the recipe data live in src/domain/savedPantry.ts.
import type { PantryItem } from '../domain/pantry';
import type { PantryRepository } from '../domain/PantryRepository';
import type { SavedPantry } from '../domain/savedPantry';
import type { WritableSqlDatabase } from './SqlDatabase';

const LOAD_ITEMS_SQL = 'SELECT ingredient, quantity, unit, shown_unit FROM pantry_items ORDER BY position';
const LOAD_SEASONINGS_SQL = 'SELECT ingredient FROM seasonings_on ORDER BY position';
const CLEAR_SQL = 'DELETE FROM pantry_items; DELETE FROM seasonings_on;';
const INSERT_ITEM_SQL = `INSERT INTO pantry_items (ingredient, position, quantity, unit, shown_unit)
  VALUES ($ingredient, $position, $quantity, $unit, $shownUnit)`;
const INSERT_SEASONING_SQL = 'INSERT INTO seasonings_on (ingredient, position) VALUES ($ingredient, $position)';

type PantryItemRow = { ingredient: string; quantity: number; unit: string | null; shown_unit: string | null };

function toPantryItem(row: PantryItemRow): PantryItem {
  const item: PantryItem = { name: row.ingredient, quantity: row.quantity, unit: row.unit };
  return row.shown_unit === null ? item : { ...item, shownUnit: row.shown_unit };
}

/**
 * user.db through one connection. Loads and saves run one at a time, in the order they were asked for: two
 * transactions on one connection would otherwise overlap (expo-sqlite's withTransactionAsync isn't exclusive),
 * and the last save asked for must be the one that's kept.
 */
export class SqlitePantryRepository implements PantryRepository {
  private opened: Promise<WritableSqlDatabase> | null = null;
  /** The last load or save asked for; the next one waits for it to finish, whether it worked or not. */
  private queue: Promise<unknown> = Promise.resolve();

  /** `open` opens and migrates user.db. It is called the first time the pantry is loaded or saved, and only once. */
  constructor(private readonly open: () => Promise<WritableSqlDatabase>) {}

  private database(): Promise<WritableSqlDatabase> {
    this.opened ??= this.open();
    return this.opened;
  }

  private inTurn<T>(task: (db: WritableSqlDatabase) => Promise<T>): Promise<T> {
    const run = this.queue.then(async () => task(await this.database()));
    this.queue = run.catch(() => undefined);
    return run;
  }

  load(): Promise<SavedPantry> {
    return this.inTurn(async (db) => {
      const items = await db.getAllAsync<PantryItemRow>(LOAD_ITEMS_SQL, {});
      const seasonings = await db.getAllAsync<{ ingredient: string }>(LOAD_SEASONINGS_SQL, {});
      return { items: items.map(toPantryItem), seasoningsOn: seasonings.map((row) => row.ingredient) };
    });
  }

  save(pantry: SavedPantry): Promise<void> {
    return this.inTurn((db) => this.write(db, pantry));
  }

  private async write(db: WritableSqlDatabase, pantry: SavedPantry): Promise<void> {
    await db.withTransactionAsync(async () => {
      await db.execAsync(CLEAR_SQL);
      for (const [position, item] of pantry.items.entries()) {
        await db.runAsync(INSERT_ITEM_SQL, {
          $ingredient: item.name,
          $position: position,
          $quantity: item.quantity,
          $unit: item.unit,
          $shownUnit: item.shownUnit ?? null,
        });
      }
      for (const [position, name] of pantry.seasoningsOn.entries()) {
        await db.runAsync(INSERT_SEASONING_SQL, { $ingredient: name, $position: position });
      }
    });
  }
}
