import { getSimilarRecipes } from '../../../src/services/getSimilarRecipes';
import { InMemoryRecipeRepository } from '../../fakes/InMemoryRecipeRepository';

const repo = new InMemoryRecipeRepository([
  { id: 1, name: 'Sloppy Joes A', duplicateGroup: 'DUP-2 Sloppy Joes' },
  { id: 2, name: 'Sloppy Joes B', duplicateGroup: 'DUP-2 Sloppy Joes' },
  { id: 3, name: 'Tuna Melt', duplicateGroup: 'DUP-1 Tuna Melt' },
  { id: 4, name: 'Toast', duplicateGroup: null },
]);

describe('getSimilarRecipes', () => {
  it('returns other recipes in the same duplicate group', async () => {
    expect((await getSimilarRecipes(repo, 1)).map((r) => r.name)).toEqual(['Sloppy Joes B']);
  });

  it('returns an empty list for a recipe without a duplicate group', async () => {
    expect(await getSimilarRecipes(repo, 4)).toEqual([]);
  });

  it('returns an empty list for an unknown recipe id', async () => {
    expect(await getSimilarRecipes(repo, 999)).toEqual([]);
  });
});
