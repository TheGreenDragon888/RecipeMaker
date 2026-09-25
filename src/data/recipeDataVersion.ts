// DATA ACCESS LAYER: make sure the bundled recipes.db is the data version this code expects.
import type { SqlDatabase } from './SqlDatabase';

/** Must equal PRAGMA user_version inside assets/data/recipes.db. Bump both together. */
export const RECIPE_DATA_VERSION = 1;

export class RecipeDataVersionError extends Error {
  constructor(public readonly found: number | undefined) {
    super(`recipes.db data version ${found} != expected ${RECIPE_DATA_VERSION}`);
    this.name = 'RecipeDataVersionError';
  }
}

export async function assertRecipeDataVersion(db: SqlDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version;', {});
  if (row?.user_version !== RECIPE_DATA_VERSION) throw new RecipeDataVersionError(row?.user_version);
}
