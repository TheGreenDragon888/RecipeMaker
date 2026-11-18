// DATA ACCESS LAYER: keeps the user's pantry in user.db. Plain reads and writes; the rules for fitting a saved
// pantry to the recipe data live in src/domain/savedPantry.ts.
import type { PantryItem } from '../domain/pantry';
import type { PantryRepository } from '../domain/PantryRepository';
import type { SavedPantry } from '../domain/savedPantry';
import type { WritableSqlDatabase } from './SqlDatabase';
import type { UserDatabaseQueue } from './UserDatabaseQueue';

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

export class SqlitePantryRepository implements PantryRepository {
  constructor(private readonly queue: UserDatabaseQueue) {}

  load(): Promise<SavedPantry> {
    return this.queue.inTurn(async (db) => {
      const items = await db.getAllAsync<PantryItemRow>(LOAD_ITEMS_SQL, {});
      const seasonings = await db.getAllAsync<{ ingredient: string }>(LOAD_SEASONINGS_SQL, {});
      return { items: items.map(toPantryItem), seasoningsOn: seasonings.map((row) => row.ingredient) };
    });
  }

  save(pantry: SavedPantry): Promise<void> {
    return this.queue.inTurn((db) => this.write(db, pantry));
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
