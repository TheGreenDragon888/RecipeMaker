import type { PantryRepository } from '../../../src/domain/PantryRepository';
import type { PantryTracking } from '../../../src/domain/pantryCatalog';
import type { SavedPantry } from '../../../src/domain/savedPantry';
import { checkRecipesReadiness } from '../../../src/services/checkRecipesReadiness';
import { InMemoryPantryRepository } from '../../fakes/InMemoryPantryRepository';
import { InMemoryRecipeRepository } from '../../fakes/InMemoryRecipeRepository';

const tracking: PantryTracking[] = [
  { ingredient: 'garlic', tracking: 'count', defaultUnit: 'clove' },
  { ingredient: 'onion', tracking: 'count', defaultUnit: 'each' },
  { ingredient: 'hamburger bun', tracking: 'count', defaultUnit: 'each' },
];

const recipes = new InMemoryRecipeRepository(
  [
    { id: 1, ingredients: [{ ingredient: 'garlic', quantityMin: 2, quantityMax: 2, unit: 'clove' }] },
    { id: 2, ingredients: [{ ingredient: 'onion', quantityMin: 1, quantityMax: 1, unit: 'each' }] },
    {
      id: 3,
      ingredients: [{ ingredient: 'potato roll', quantityMin: 4, quantityMax: 4, unit: 'each', substitute: 'hamburger buns' }],
    },
  ],
  { 'hamburger buns': 'hamburger bun' },
  tracking,
);

const pantry: SavedPantry = {
  items: [
    { name: 'garlic', quantity: 6, unit: 'clove' },
    { name: 'hamburger bun', quantity: 4, unit: 'each' },
  ],
  seasoningsOn: [],
};

describe('checkRecipesReadiness', () => {
  it('gives each recipe its readiness', async () => {
    const result = await checkRecipesReadiness(recipes, new InMemoryPantryRepository(pantry), [1, 2]);
    expect([result?.get(1)?.status, result?.get(2)?.status]).toEqual(['ready', 'almost']);
  });

  it('resolves a substitute through its alias', async () => {
    const result = await checkRecipesReadiness(recipes, new InMemoryPantryRepository(pantry), [3]);
    expect(result?.get(3)?.status).toBe('swap');
  });

  it('returns null when the pantry is empty', async () => {
    expect(await checkRecipesReadiness(recipes, new InMemoryPantryRepository(), [1])).toBeNull();
  });

  it('loads the saved pantry once, however many recipes it checks', async () => {
    const repo = new InMemoryPantryRepository(pantry);
    const load = jest.spyOn(repo, 'load');
    await checkRecipesReadiness(recipes, repo, [1, 2, 3]);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('fails when the saved pantry cannot be read', async () => {
    const broken: PantryRepository = { load: () => Promise.reject(new Error('corrupt')), save: jest.fn() };
    await expect(checkRecipesReadiness(recipes, broken, [1])).rejects.toThrow('corrupt');
  });
});
