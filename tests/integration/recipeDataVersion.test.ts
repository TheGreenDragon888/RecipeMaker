import { assertRecipeDataVersion, RECIPE_DATA_VERSION, RecipeDataVersionError } from '../../src/data/recipeDataVersion';
import type { SqlDatabase } from '../../src/data/SqlDatabase';
import { openRecipesDbForTest } from '../support/nodeSqliteDatabase';

const dbWithVersion = (version: number): SqlDatabase => ({
  getAllAsync: async () => [],
  getFirstAsync: async <T,>() => ({ user_version: version }) as T,
});

describe('assertRecipeDataVersion', () => {
  it('accepts the bundled recipes.db', async () => {
    await expect(assertRecipeDataVersion(openRecipesDbForTest())).resolves.toBeUndefined();
  });

  it('throws RecipeDataVersionError when the database version does not match the code', async () => {
    await expect(assertRecipeDataVersion(dbWithVersion(RECIPE_DATA_VERSION + 1))).rejects.toThrow(RecipeDataVersionError);
  });
});
