import type { PantryRepository } from '../../../src/domain/PantryRepository';
import type { PantryTracking } from '../../../src/domain/pantryCatalog';
import { loadSavedPantry } from '../../../src/services/loadSavedPantry';
import { InMemoryPantryRepository } from '../../fakes/InMemoryPantryRepository';
import { InMemoryRecipeRepository } from '../../fakes/InMemoryRecipeRepository';

/** The recipe data: garlic and green onion are counted, paprika and smoked paprika are seasonings. */
const tracking: PantryTracking[] = [
  { ingredient: 'garlic', tracking: 'count', defaultUnit: 'clove' },
  { ingredient: 'green onion', tracking: 'count', defaultUnit: 'stalk' },
  { ingredient: 'paprika', tracking: 'presence', defaultUnit: null },
  { ingredient: 'smoked paprika', tracking: 'presence', defaultUnit: null },
];
/** Ingredients renamed in a data update keep their old names as aliases. */
const aliases = { scallions: 'green onion', 'pimenton': 'smoked paprika' };
const recipeRepo = () => new InMemoryRecipeRepository([], aliases, tracking);

describe('loadSavedPantry', () => {
  it('returns an empty pantry when nothing was saved', async () => {
    const restored = await loadSavedPantry(new InMemoryPantryRepository(), recipeRepo());
    expect(restored).toEqual({ pantry: [], seasoningsOn: [], changes: [] });
  });

  it('follows a renamed ingredient in the list to its new name', async () => {
    const saved = new InMemoryPantryRepository({
      items: [{ name: 'scallions', quantity: 3, unit: 'stalk' }],
      seasoningsOn: [],
    });
    expect((await loadSavedPantry(saved, recipeRepo())).pantry).toEqual([{ name: 'green onion', quantity: 3, unit: 'stalk' }]);
  });

  it('follows a renamed seasoning to its new name', async () => {
    const saved = new InMemoryPantryRepository({ items: [], seasoningsOn: ['pimenton'] });
    expect((await loadSavedPantry(saved, recipeRepo())).seasoningsOn).toEqual(['smoked paprika']);
  });

  it('fits the saved pantry to the current recipe data', async () => {
    const saved = new InMemoryPantryRepository({ items: [{ name: 'ale', quantity: 1, unit: 'cup' }], seasoningsOn: [] });
    expect(await loadSavedPantry(saved, recipeRepo())).toEqual({
      pantry: [],
      seasoningsOn: [],
      changes: [{ kind: 'removed', name: 'ale' }],
    });
  });

  it("fails when the saved pantry can't be read", async () => {
    const broken: PantryRepository = { load: () => Promise.reject(new Error('disk')), save: async () => {} };
    await expect(loadSavedPantry(broken, recipeRepo())).rejects.toThrow('disk');
  });

  it("fails when the recipe data can't be read, since the pantry can't be fitted to it", async () => {
    const recipes = recipeRepo();
    jest.spyOn(recipes, 'listPantryTracking').mockRejectedValue(new Error('recipes.db'));
    await expect(loadSavedPantry(new InMemoryPantryRepository(), recipes)).rejects.toThrow('recipes.db');
  });
});
