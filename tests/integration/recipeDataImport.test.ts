// Data version 3 (the 2026-11 college-recipe import), checked against the bundled recipes.db: the Meal Prep tags,
// one recipe kept per duplicate group, and the import's ingredients merged into ones the data already had.
import { SqliteRecipeRepository } from '../../src/data/SqliteRecipeRepository';
import { openRawRecipesDb, openRecipesDbForTest } from '../support/nodeSqliteDatabase';

const repo = new SqliteRecipeRepository(openRecipesDbForTest());
const raw = openRawRecipesDb();
const ids = (sql: string) => (raw.prepare(sql).all() as { recipe_id: number }[]).map((row) => row.recipe_id);

/** Recipes from version 2 (ids 1-131) that serve at least 4 and keep well when made ahead. */
const EXISTING_MEAL_PREP = [
  2, 4, 5, 7, 8, 9, 14, 16, 17, 22, 26, 29, 32, 33, 35, 36, 38, 39, 50, 51, 53, 54, 55, 56, 58, 61, 62, 63, 64, 65,
  66, 67, 68, 69, 70, 74, 79, 91, 92, 94, 95, 97, 98, 100, 101, 102, 103, 107, 111, 113, 115, 116, 117, 118, 125,
  127, 128, 129, 131,
];

/** Import recipes left out because another recipe in their duplicate group was quicker (or as quick and simpler). */
const LEFT_OUT = [
  134, 139, 140, 144, 178, 185, 196, 208, 212, 213, 224, 228, 232, 245, 288, 292, 295, 312, 324, 326, 341, 347, 370,
  385, 387, 388, 414, 416, 429, 433, 435, 444, 446, 489, 495, 507, 508,
];

describe('recipe tags', () => {
  it('uses only the Meal Prep tag', () => {
    expect(raw.prepare('SELECT DISTINCT tag FROM recipe_tags').all()).toEqual([{ tag: 'Meal Prep' }]);
  });

  it('tags only recipes that serve at least 4', () => {
    expect(ids('SELECT recipe_id FROM recipe_tags JOIN recipes USING (recipe_id) WHERE servings_min < 4')).toEqual([]);
  });

  it('tags the reviewed version 2 recipes', () => {
    expect(ids('SELECT recipe_id FROM recipe_tags WHERE recipe_id <= 131 ORDER BY recipe_id')).toEqual(EXISTING_MEAL_PREP);
  });

  it('tags 232 imported recipes', () => {
    expect(ids('SELECT recipe_id FROM recipe_tags WHERE recipe_id > 131')).toHaveLength(232);
  });
});

describe('duplicate groups', () => {
  it('leaves out every import duplicate but one per group', () => {
    const placeholders = LEFT_OUT.map(() => '?').join(', ');
    expect(raw.prepare(`SELECT recipe_id FROM recipes WHERE recipe_id IN (${placeholders})`).all(...LEFT_OUT)).toEqual([]);
  });

  it('keeps no import group with more than one recipe', () => {
    const repeated = raw
      .prepare(
        `SELECT duplicate_group FROM recipes WHERE recipe_id > 131 AND duplicate_group IS NOT NULL
         GROUP BY duplicate_group HAVING count(*) > 1`,
      )
      .all();
    expect(repeated).toEqual([]);
  });

  it('keeps the 464 other imported recipes', () => {
    expect(ids('SELECT recipe_id FROM recipes WHERE recipe_id > 131')).toHaveLength(464);
  });
});

describe('import ingredients filed under the name the data already had', () => {
  it.each([
    ['rotisserie chicken', 'chicken'],
    ['cream of mushroom soup', 'condensed cream of mushroom soup'],
    ['artichoke heart', 'artichoke hearts'],
    ['frozen pepper and onion stir-fry blend', 'frozen peppers and onions'],
  ])('the name "%s" finds %s', async (typed, ingredient) => {
    expect(await repo.findIngredient(typed)).toBe(ingredient);
  });

  it.each([
    [555, 7],
    [574, 4],
  ])('recipe %i line %i is dried dill', (recipeId, lineNumber) => {
    expect(
      raw.prepare('SELECT ingredient FROM recipe_ingredients WHERE recipe_id = ? AND line_number = ?').get(recipeId, lineNumber),
    ).toEqual({ ingredient: 'dried dill' });
  });
});
