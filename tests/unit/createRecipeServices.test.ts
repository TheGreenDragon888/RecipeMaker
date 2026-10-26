import { createRecipeServices } from '../../src/createRecipeServices';
import { InMemoryPantryRepository } from '../fakes/InMemoryPantryRepository';
import { InMemoryRecipeRepository } from '../fakes/InMemoryRecipeRepository';

const repo = new InMemoryRecipeRepository(
  [
    { id: 1, name: 'Joes A', duplicateGroup: 'DUP', activeTimeMinutes: 10, ingredients: [{ ingredient: 'ground beef' }] },
    { id: 2, name: 'Joes B', duplicateGroup: 'DUP', activeTimeMinutes: 20, ingredients: [{ ingredient: 'ground beef' }] },
  ],
  { beef: 'ground beef' },
  [{ ingredient: 'ground beef', tracking: 'count', defaultUnit: 'lb' }],
);
const pantryRepo = new InMemoryPantryRepository({
  items: [{ name: 'beef', quantity: 2, unit: 'lb' }],
  seasoningsOn: [],
});
const services = createRecipeServices(repo, pantryRepo);
const names = (rs: { name: string }[]) => rs.map((r) => r.name);

describe('createRecipeServices', () => {
  it('wires ingredient search to the repository', async () => {
    expect(names(await services.searchRecipesByIngredient('beef'))).toEqual(['Joes A', 'Joes B']);
  });

  it('wires pantry matching to the repository', async () => {
    expect(await services.findRecipesFromPantry(['beef'])).toHaveLength(2);
  });

  it('wires filtering to the repository', async () => {
    expect(names(await services.filterRecipes({ maxActiveMinutes: 10, people: 1 }))).toEqual(['Joes A']);
  });

  it('wires recipe detail to the repository', async () => {
    expect((await services.getRecipeDetail(2)).recipe.name).toBe('Joes B');
  });

  it('wires similar recipes to the repository', async () => {
    expect(names(await services.getSimilarRecipes(1))).toEqual(['Joes B']);
  });

  it('wires ingredient suggestions to the repository', async () => {
    expect(await services.suggestIngredients('gro')).toEqual([
      { ingredient: 'ground beef', matchedAlias: null },
    ]);
  });

  it('wires ingredient lookup to the repository', async () => {
    expect(await services.findIngredient('beef')).toBe('ground beef');
  });

  it('wires the pantry catalog to the repository', async () => {
    expect((await services.getPantryCatalog()).units).toEqual({ 'ground beef': 'lb' });
  });

  it('wires the full recipe list to the repository', async () => {
    expect(names(await services.listAllRecipes())).toEqual(['Joes A', 'Joes B']);
  });

  it('wires pantry loading to the pantry and recipe repositories', async () => {
    expect((await services.loadSavedPantry()).pantry).toEqual([{ name: 'ground beef', quantity: 2, unit: 'lb' }]);
  });

  it('wires pantry saving to the pantry repository', async () => {
    await services.savePantry([], ['paprika']);
    expect(pantryRepo.saved).toEqual({ items: [], seasoningsOn: ['paprika'] });
  });
});
