import type { PantryTracking } from '../../../src/domain/pantryCatalog';
import type { SavedPantry } from '../../../src/domain/savedPantry';
import { checkRecipeAgainstPantry } from '../../../src/services/checkRecipeAgainstPantry';
import { InMemoryPantryRepository } from '../../fakes/InMemoryPantryRepository';
import { InMemoryRecipeRepository } from '../../fakes/InMemoryRecipeRepository';

/** The recipe data: garlic, onion and hamburger buns are counted; paprika is a seasoning. */
const tracking: PantryTracking[] = [
  { ingredient: 'garlic', tracking: 'count', defaultUnit: 'clove' },
  { ingredient: 'onion', tracking: 'count', defaultUnit: 'each' },
  { ingredient: 'hamburger bun', tracking: 'count', defaultUnit: 'each' },
  { ingredient: 'paprika', tracking: 'presence', defaultUnit: null },
];

/** Recipe 1: 3 cloves garlic, 1 onion, and 12 potato rolls (or hamburger buns). Recipe 2: 1 tsp paprika. */
const recipeRepo = new InMemoryRecipeRepository(
  [
    {
      id: 1,
      ingredients: [
        { ingredient: 'garlic', quantityMin: 3, quantityMax: 3, unit: 'clove' },
        { ingredient: 'onion', quantityMin: 1, quantityMax: 1, unit: 'each' },
        { ingredient: 'potato roll', quantityMin: 12, quantityMax: 12, unit: 'each', substitute: 'hamburger buns' },
      ],
    },
    { id: 2, ingredients: [{ ingredient: 'paprika', quantityMin: 1, quantityMax: 1, unit: 'tsp' }] },
  ],
  { 'hamburger buns': 'hamburger bun' },
  tracking,
);

const check = (saved: SavedPantry, recipeId = 1) =>
  checkRecipeAgainstPantry(recipeRepo, new InMemoryPantryRepository(saved), recipeId);

describe('checkRecipeAgainstPantry', () => {
  it('checks each line of the recipe against the saved pantry', async () => {
    const checks = await check({ items: [{ name: 'garlic', quantity: 6, unit: 'clove' }], seasoningsOn: [] });
    expect([checks?.get(1)?.status, checks?.get(2)?.status]).toEqual(['have', 'missing']);
  });

  it('resolves a substitute to its ingredient before looking for it in the pantry', async () => {
    const checks = await check({ items: [{ name: 'hamburger bun', quantity: 12, unit: 'each' }], seasoningsOn: [] });
    expect(checks?.get(3)).toMatchObject({ status: 'swap', substitute: 'hamburger buns' });
  });

  it('counts the saved seasonings as on hand', async () => {
    const checks = await check({ items: [], seasoningsOn: ['paprika'] }, 2);
    expect(checks?.get(1)).toEqual({ status: 'have', have: null });
  });

  it('returns null when nothing is saved, since there is no pantry to compare with', async () => {
    expect(await check({ items: [], seasoningsOn: [] })).toBeNull();
  });
});
