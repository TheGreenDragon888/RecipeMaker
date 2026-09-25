import { createRecipeServices } from '../../src/createRecipeServices';
import { InMemoryRecipeRepository } from '../fakes/InMemoryRecipeRepository';

const repo = new InMemoryRecipeRepository(
  [
    { id: 1, name: 'Joes A', duplicateGroup: 'DUP', activeTimeMinutes: 10, ingredients: [{ ingredient: 'ground beef' }] },
    { id: 2, name: 'Joes B', duplicateGroup: 'DUP', activeTimeMinutes: 20, ingredients: [{ ingredient: 'ground beef' }] },
  ],
  { beef: 'ground beef' },
);
const services = createRecipeServices(repo);
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
    expect(await services.suggestIngredients('gro')).toEqual(['ground beef']);
  });
});
