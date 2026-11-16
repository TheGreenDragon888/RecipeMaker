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

  it('has 2867 recipes', () => expect(count('SELECT COUNT(*) AS c FROM recipes')).toBe(2867));
  it('has 24477 ingredient rows', () => expect(count('SELECT COUNT(*) AS c FROM recipe_ingredients')).toBe(24477));
  // Version 4 adds another 2,273 recipes and 125 ingredients to the version-3 bundle.
  it('has 593 distinct ingredients', () =>
    expect(count('SELECT COUNT(DISTINCT ingredient) AS c FROM recipe_ingredients')).toBe(593));
  it('has 1224 aliases', () => expect(count('SELECT COUNT(*) AS c FROM ingredient_aliases')).toBe(1224));
  it('is data version 4', () => expect(raw.prepare('PRAGMA user_version').get()).toEqual({ user_version: 4 }));
  it('has no foreign key violations', () => expect(raw.prepare('PRAGMA foreign_key_check').all()).toEqual([]));
});

describe('acceptance checks', () => {
  it('searching "Chick Peas" finds 25 recipes ordered by total time', async () => {
    expect(names(await searchRecipesByIngredient(repo, 'Chick Peas'))).toEqual([
      'Scallion Herb Chickpea Salad',
      'Chickpea Tacos',
      'Greek Style Sausage & Chick Peas',
      'Sriracha Chickpea Salad Wraps',
      'Chicken Curry with Chickpeas and Tomatoes',
      'Indian Rice Curry with Chickpeas',
      'Vegetarian Chili for One',
      'Curried Chickpeas',
      'Curried Chickpeas with Spinach',
      'Pasta with Spinach, Chickpeas, and Bacon',
      'Savory Bean Pasta',
      '1-Pot Chickpea Shakshuka',
      'Chickpeas and Macaroni',
      'Pasta e Ceci',
      'Beef and Tomato Rice Bowl',
      'Coconut Curry Chickpeas',
      'Easy Chorizo Soup',
      'Spicy Chicken Stew',
      'Spinach Egg Pie (Eggah bi Sabaneh)',
      'Three Bean Stew with Vegetables',
      'Chana Saag Curry',
      'Chickpea Tomato Soup with Rosemary',
      'Lisa\'s Co-Op Kale Soup',
      'Spanish Chickpeas and Rice',
      'Easy Homemade Falafel',
    ]);
  });

  it('searching "scallions" finds 214 recipes', async () => {
    expect(await searchRecipesByIngredient(repo, 'scallions')).toHaveLength(214);
  });

  it('searching "noodle" falls back to partial matches across both imports', async () => {
    const matches = await searchRecipesByIngredient(repo, 'noodle');
    expect(matches).toHaveLength(137);
    // Retain the exact historical subset as coverage alongside the expanded result count.
    expect(names(matches.filter((recipe) => recipe.id <= 632))).toEqual([
      'Beef Stroganoff',
      'Beef Teriyaki Noodles',
      'Chicken Noodle Casserole',
      'Crockpot Chicken Noodle Soup',
      'Easy Tuna Casserole',      'Grandma\'s Tomato Soup',
      'Hearty Beef Noodle Soup',
      'Lo Mein for One',      'Poor Man\'s Casserole',
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

  it('filtering to 15 active minutes for 4 people finds 546 recipes', async () => {
    expect(await filterRecipes(repo, { maxActiveMinutes: 15, people: 4 })).toHaveLength(546);
  });

  it('autocompleting "par" suggests names starting with it, then names containing it, then aliases containing it', async () => {
    expect(await suggestIngredients(repo, 'par')).toEqual([
      { ingredient: 'Parmesan cheese', matchedAlias: null },
      { ingredient: 'parsley', matchedAlias: null },
      { ingredient: 'asparagus', matchedAlias: null },
      { ingredient: 'dried parsley', matchedAlias: null },
      { ingredient: 'brown gravy', matchedAlias: 'prepared brown gravy' },
      { ingredient: 'everything bagel seasoning', matchedAlias: 'prepared everything bagel topping' },
      { ingredient: 'Italian meatball', matchedAlias: 'prepared italian meatballs' },
      { ingredient: 'marinara sauce', matchedAlias: 'prepared marinara sauce' },
      { ingredient: 'sun-dried tomato pesto', matchedAlias: 'prepared sun dried tomato pesto' },
    ]);
  });

  it('autocompleting "ground b" suggests the name ground beef before the alias for black pepper', async () => {
    expect(await suggestIngredients(repo, 'ground b')).toEqual([
      { ingredient: 'ground beef', matchedAlias: null },
      { ingredient: 'black pepper', matchedAlias: 'ground black pepper' },
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
