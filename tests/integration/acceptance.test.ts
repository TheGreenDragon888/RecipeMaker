// Acceptance checks from the recipe database handoff guide (§8), run through the real services
// against the bundled recipes.db.
import { SqliteRecipeRepository } from '../../src/data/SqliteRecipeRepository';
import { filterRecipes } from '../../src/services/filterRecipes';
import { findRecipesFromPantry } from '../../src/services/findRecipesFromPantry';
import { getRecipeDetail } from '../../src/services/getRecipeDetail';
import { getSimilarRecipes } from '../../src/services/getSimilarRecipes';
import { searchRecipesByIngredient } from '../../src/services/searchRecipesByIngredient';
import { suggestIngredients } from '../../src/services/suggestIngredients';
import { openRawRecipesDb, openRecipesDbForTest } from '../support/nodeSqliteDatabase';

const repo = new SqliteRecipeRepository(openRecipesDbForTest());
const names = (rs: { name: string }[]) => rs.map((r) => r.name);

describe('bundled recipes.db contents', () => {
  const raw = openRawRecipesDb();
  const count = (sql: string) => (raw.prepare(sql).get() as { c: number }).c;

  it('has 130 recipes', () => expect(count('SELECT COUNT(*) AS c FROM recipes')).toBe(130));
  it('has 1017 ingredient rows', () => expect(count('SELECT COUNT(*) AS c FROM recipe_ingredients')).toBe(1017));
  it('has 269 distinct ingredients', () =>
    expect(count('SELECT COUNT(DISTINCT ingredient) AS c FROM recipe_ingredients')).toBe(269));
  it('has 698 aliases', () => expect(count('SELECT COUNT(*) AS c FROM ingredient_aliases')).toBe(698));
  it('is data version 1', () => expect(raw.prepare('PRAGMA user_version').get()).toEqual({ user_version: 1 }));
  it('has no foreign key violations', () => expect(raw.prepare('PRAGMA foreign_key_check').all()).toEqual([]));
});

describe('acceptance checks', () => {
  it('searching "Chick Peas" finds 4 recipes ordered by total time', async () => {
    expect(names(await searchRecipesByIngredient(repo, 'Chick Peas'))).toEqual([
      'Scallion Herb Chickpea Salad',
      'Greek Style Sausage & Chick Peas',
      'Curried Chickpeas with Spinach',
      'Pasta e Ceci',
    ]);
  });

  it('searching "scallions" finds 23 recipes', async () => {
    expect(await searchRecipesByIngredient(repo, 'scallions')).toHaveLength(23);
  });

  it('searching "noodle" falls back to the 3 partial matches', async () => {
    expect(names(await searchRecipesByIngredient(repo, 'noodle'))).toEqual([
      'Hearty Beef Noodle Soup',
      'Quick and Easy Goulash',
      'Spicy Sriracha Noodles',
    ]);
  });

  it('a carbonara pantry puts Spaghetti Carbonara in the top 2', async () => {
    const matches = await findRecipesFromPantry(repo, ['eggs', 'Parmesan', 'spaghetti', 'bacon', 'garlic']);
    expect(names(matches.slice(0, 2).map((m) => m.recipe))).toContain('Spaghetti Carbonara');
  });

  it('filtering to 15 active minutes for 4 people finds 23 recipes', async () => {
    expect(await filterRecipes(repo, { maxActiveMinutes: 15, people: 4 })).toHaveLength(23);
  });

  it('autocompleting "par" suggests Parmesan cheese and parsley', async () => {
    expect(await suggestIngredients(repo, 'par')).toEqual(['Parmesan cheese', 'parsley']);
  });

  it('Homemade Chicken Nuggets is similar to Pretzel Coated Chicken Nuggets', async () => {
    expect(names(await getSimilarRecipes(repo, 122))).toEqual(['Pretzel Coated Chicken Nuggets']);
  });

  it('recipe 1 is Spicy Sriracha Noodles, 15 min, serves 2, starting with 4 oz lo mein noodle', async () => {
    const { recipe, ingredients } = await getRecipeDetail(repo, 1);
    expect([recipe.name, recipe.totalTimeMinutes, recipe.servingsMin, recipe.servingsMax]).toEqual([
      'Spicy Sriracha Noodles',
      15,
      2,
      2,
    ]);
    expect([ingredients[0].quantityMin, ingredients[0].unit, ingredients[0].ingredient]).toEqual([4, 'oz', 'lo mein noodle']);
  });
});
