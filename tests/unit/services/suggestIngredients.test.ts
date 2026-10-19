import { suggestIngredients } from '../../../src/services/suggestIngredients';
import { InMemoryRecipeRepository, type FakeRecipe } from '../../fakes/InMemoryRecipeRepository';

describe('suggestIngredients', () => {
  it('ranks direct names before alias matches and includes the matching alias', async () => {
    const repo = new InMemoryRecipeRepository(
      [{ id: 1, ingredients: [{ ingredient: 'garlic' }, { ingredient: 'black pepper' }] }],
      { 'ground black pepper': 'black pepper' },
    );
    expect(await suggestIngredients(repo, 'g')).toEqual([
      { ingredient: 'garlic', matchedAlias: null },
      { ingredient: 'black pepper', matchedAlias: 'ground black pepper' },
    ]);
  });

  it('normalizes the prefix before searching', async () => {
    const repo = new InMemoryRecipeRepository([{ id: 1, ingredients: [{ ingredient: 'parsley' }] }]);
    expect(await suggestIngredients(repo, '  PAR')).toEqual([{ ingredient: 'parsley', matchedAlias: null }]);
  });

  it('returns an empty list for a blank prefix', async () => {
    const repo = new InMemoryRecipeRepository([{ id: 1, ingredients: [{ ingredient: 'parsley' }] }]);
    expect(await suggestIngredients(repo, ' ')).toEqual([]);
  });

  it('returns at most 10 suggestions', async () => {
    const recipes: FakeRecipe[] = [
      { id: 1, ingredients: Array.from({ length: 15 }, (_, i) => ({ ingredient: `pa${String(i).padStart(2, '0')}` })) },
    ];
    expect(await suggestIngredients(new InMemoryRecipeRepository(recipes), 'pa')).toHaveLength(10);
  });
});
