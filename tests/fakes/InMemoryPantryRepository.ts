import type { PantryRepository } from '../../src/domain/PantryRepository';
import type { SavedPantry } from '../../src/domain/savedPantry';

/** Test double for PantryRepository: keeps the saved pantry in memory, starting empty or with the one given. */
export class InMemoryPantryRepository implements PantryRepository {
  saved: SavedPantry;

  constructor(saved: SavedPantry = { items: [], seasoningsOn: [] }) {
    this.saved = saved;
  }

  async load(): Promise<SavedPantry> {
    return this.saved;
  }

  async save(pantry: SavedPantry): Promise<void> {
    this.saved = pantry;
  }
}
