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

  it('has 594 recipes', () => expect(count('SELECT COUNT(*) AS c FROM recipes')).toBe(594));
  it('has 5902 ingredient rows', () => expect(count('SELECT COUNT(*) AS c FROM recipe_ingredients')).toBe(5902));
  // Version 3 (the college-recipe import) added 464 recipes and their ingredients and aliases.
  it('has 468 distinct ingredients', () =>
    expect(count('SELECT COUNT(DISTINCT ingredient) AS c FROM recipe_ingredients')).toBe(468));
  it('has 1099 aliases', () => expect(count('SELECT COUNT(*) AS c FROM ingredient_aliases')).toBe(1099));
  it('is data version 3', () => expect(raw.prepare('PRAGMA user_version').get()).toEqual({ user_version: 3 }));
  it('has no foreign key violations', () => expect(raw.prepare('PRAGMA foreign_key_check').all()).toEqual([]));
});

describe('acceptance checks', () => {
  it('searching "Chick Peas" finds 10 recipes ordered by total time', async () => {
    expect(names(await searchRecipesByIngredient(repo, 'Chick Peas'))).toEqual([
      'Scallion Herb Chickpea Salad',
      'Greek Style Sausage & Chick Peas',
      'Sriracha Chickpea Salad Wraps',
      'Vegetarian Chili for One',
      'Curried Chickpeas with Spinach',
      '1-Pot Chickpea Shakshuka',
      'Pasta e Ceci',
      'Beef and Tomato Rice Bowl',
      'Spanish Chickpeas and Rice',
      'Easy Homemade Falafel',
    ]);
  });

  it('searching "scallions" finds 85 recipes', async () => {
    expect(await searchRecipesByIngredient(repo, 'scallions')).toHaveLength(85);
  });

  it('searching "noodle" falls back to the 14 partial matches', async () => {
    expect(names(await searchRecipesByIngredient(repo, 'noodle'))).toEqual([
      'Beef Stroganoff',
      'Beef Teriyaki Noodles',
      'Chicken Noodle Casserole',
      'Crockpot Chicken Noodle Soup',
      'Easy Tuna Casserole',
      "Grandma's Tomato Soup",
      'Hearty Beef Noodle Soup',
      'Lo Mein for One',
      "Poor Man's Casserole",
      'Quick and Easy Goulash',
      'Skillet Lasagna',
      'Slow-Cooker Chicken Stroganoff',
      'Slow-Cooker Ranch Chicken',
      'Spicy Sriracha Noodles',
    ]);
  });

  it('a carbonara pantry puts Pasta Carbonara for One in the top 2', async () => {
    const matches = await findRecipesFromPantry(repo, ['eggs', 'Parmesan', 'spaghetti', 'bacon', 'garlic']);
    expect(names(matches.slice(0, 2).map((m) => m.recipe))).toContain('Pasta Carbonara for One');
  });

  it('filtering to 15 active minutes for 4 people finds 65 recipes', async () => {
    expect(await filterRecipes(repo, { maxActiveMinutes: 15, people: 4 })).toHaveLength(65);
  });

  it('autocompleting "par" suggests direct names before matching aliases', async () => {
    expect(await suggestIngredients(repo, 'par')).toEqual([
      { ingredient: 'Parmesan cheese', matchedAlias: null },
      { ingredient: 'parsley', matchedAlias: null },
      { ingredient: 'brown gravy', matchedAlias: 'prepared brown gravy' },
      { ingredient: 'everything bagel seasoning', matchedAlias: 'prepared everything bagel topping' },
      { ingredient: 'Italian meatball', matchedAlias: 'prepared italian meatballs' },
      { ingredient: 'marinara sauce', matchedAlias: 'prepared marinara sauce' },
    ]);
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
