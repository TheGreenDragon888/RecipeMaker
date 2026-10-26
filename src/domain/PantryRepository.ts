// BUSINESS LAYER: the contract services use to keep the user's pantry between launches. Implemented in src/data/.
import type { SavedPantry } from './savedPantry';

export interface PantryRepository {
  /** The pantry as it was last saved; an empty one when nothing has been saved yet. */
  load(): Promise<SavedPantry>;
  /** Replaces the saved pantry with this one, all or nothing. */
  save(pantry: SavedPantry): Promise<void>;
}
