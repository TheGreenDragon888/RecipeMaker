// BUSINESS LAYER: keep the Pantry screen's list and seasonings for the next launch.
import type { PantryItem } from '../domain/pantry';
import type { PantryRepository } from '../domain/PantryRepository';

/** Saves the whole pantry, replacing what was saved before. */
export async function savePantry(repo: PantryRepository, pantry: PantryItem[], seasoningsOn: string[]): Promise<void> {
  await repo.save({ items: pantry, seasoningsOn });
}
