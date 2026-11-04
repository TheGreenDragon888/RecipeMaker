import { searchRecipes } from '../../../src/services/searchRecipes';
import { InMemoryRecipeRepository } from '../../fakes/InMemoryRecipeRepository';

const names = (recipes: { name: string }[]) => recipes.map((recipe) => recipe.name);

describe('searchRecipes', () => {
  it('returns title matches before ingredient matches without duplicates', async () => {
    const repo = new InMemoryRecipeRepository([
      { id: 1, name: 'Sweet Potato Soup', ingredients: [{ ingredient: 'potato' }] },
      { id: 2, name: 'Potato Tacos', ingredients: [{ ingredient: 'tomato' }] },
      { id: 3, name: 'Hash Browns', ingredients: [{ ingredient: 'potato' }] },
      { id: 4, name: 'Potato Gnocchi', ingredients: [{ ingredient: 'potato' }] },
      { id: 5, name: 'Potato Salad', ingredients: [{ ingredient: 'potato' }] },
    ]);

    expect(names(await searchRecipes(repo, ' potato '))).toEqual([
      'Potato Gnocchi',
      'Potato Salad',
      'Potato Tacos',
      'Sweet Potato Soup',
      'Hash Browns',
    ]);
  });

  it('matches ingredient aliases by partial text', async () => {
    const repo = new InMemoryRecipeRepository(
      [
        { id: 1, name: 'Loaded Fries', ingredients: [{ ingredient: 'potato' }] },
        { id: 2, name: 'Potato Soup', ingredients: [{ ingredient: 'onion' }] },
      ],
      { spud: 'potato' },
    );

    expect(names(await searchRecipes(repo, 'spu'))).toEqual(['Loaded Fries']);
  });

  it('returns no matches for a blank query', async () => {
    const repo = new InMemoryRecipeRepository([{ id: 1, name: 'Potato Soup' }]);

    expect(await searchRecipes(repo, '   ')).toEqual([]);
  });
});
