// The recipe screen's pantry checks must agree with the counts on Results ("5/7 ingredients on hand"), run
// through the real services against the bundled recipes.db. Results' matching is left as it is, so a swap counts
// as missing there, and "not enough" (amounts aren't compared there) as on hand.
import { SqliteRecipeRepository } from '../../src/data/SqliteRecipeRepository';
import type { PantryItem } from '../../src/domain/pantry';
import type { PantryCheck } from '../../src/domain/pantryCheck';
import { STAPLES } from '../../src/domain/staples';
import { checkRecipeAgainstPantry } from '../../src/services/checkRecipeAgainstPantry';
import { findRecipesFromPantry } from '../../src/services/findRecipesFromPantry';
import { InMemoryPantryRepository } from '../fakes/InMemoryPantryRepository';
import { openRecipesDbForTest } from '../support/nodeSqliteDatabase';

const repo = new SqliteRecipeRepository(openRecipesDbForTest());

/** A saved item, with its unit left for the restore to fill in from the recipe data. */
const item = (name: string, quantity: number): PantryItem => ({ name, quantity, unit: null });

/** Each pantry also names the statuses its recipes must show on counted lines, so both exceptions are exercised. */
const PANTRIES: { name: string; items: PantryItem[]; seasoningsOn: string[]; covers: PantryCheck['status'][] }[] = [
  {
    name: 'a stir-fry pantry',
    items: [item('garlic', 2), item('onion', 1), item('chicken breast', 2), item('soy sauce', 2), item('broccoli', 1), item('white rice', 1)],
    seasoningsOn: ['chili powder', 'cilantro'],
    covers: ['have', 'notEnough', 'missing'],
  },
  {
    name: 'a baking and burger pantry',
    items: [item('egg', 6), item('milk', 1), item('all-purpose flour', 2), item('ground beef', 1), item('hamburger bun', 4), item('Cheddar cheese', 1)],
    seasoningsOn: ['cinnamon', 'baking powder'],
    covers: ['have', 'missing'],
  },
  {
    // Vegan Creamy Mushroom Ramen without its chili garlic sauce (or sriracha), and Easiest Burrito Bowl Meal Prep
    // without its ground turkey (or beef): both swaps are on counted lines.
    name: 'a pantry with swaps',
    items: [
      ...['baby bella mushroom', 'vegetable broth', 'spinach', 'instant ramen', 'coconut milk', 'green onion', 'sriracha'],
      ...['rice', 'taco seasoning', 'frozen corn', 'black bean', 'cheese', 'salsa', 'ground beef'],
    ].map((name) => item(name, 5)),
    seasoningsOn: [],
    covers: ['have', 'swap'],
  },
];

const ON_HAND: PantryCheck['status'][] = ['have', 'notEnough'];
const NOT_ON_HAND: PantryCheck['status'][] = ['missing', 'swap'];

describe.each(PANTRIES)('pantry checks for $name', ({ items, seasoningsOn, covers }) => {
  const pantryRepo = new InMemoryPantryRepository({ items, seasoningsOn });

  it("count the same ingredients on hand and missing as Results, for every recipe it lists", async () => {
    const matches = await findRecipesFromPantry(repo, [...items.map((i) => i.name), ...seasoningsOn]);
    expect(matches.length).toBeGreaterThan(0);
    const seen = new Set<PantryCheck['status']>();

    for (const match of matches) {
      const checks = await checkRecipeAgainstPantry(repo, pantryRepo, match.recipe.id);
      const counted = (await repo.getIngredients(match.recipe.id)).filter(
        (line) => !line.isOptional && !STAPLES.includes(line.ingredient.toLowerCase()),
      );
      for (const line of counted) seen.add(checks!.get(line.lineNumber)!.status);
      const distinct = (statuses: PantryCheck['status'][]) =>
        new Set(
          counted
            .filter((line) => statuses.includes(checks!.get(line.lineNumber)!.status))
            .map((line) => line.ingredient.toLowerCase()),
        ).size;

      expect({ recipe: match.recipe.name, have: distinct(ON_HAND), missing: distinct(NOT_ON_HAND) }).toEqual({
        recipe: match.recipe.name,
        have: match.haveCount,
        missing: match.missingCount,
      });
    }
    expect([...seen]).toEqual(expect.arrayContaining(covers));
  });
});
