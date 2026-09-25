import { suggestIngredients } from '../../../src/services/suggestIngredients';
import { InMemoryRecipeRepository, type FakeRecipe } from '../../fakes/InMemoryRecipeRepository';

describe('suggestIngredients', () => {
  it('suggests canonical names that start with the typed prefix', async () => {
    const repo = new InMemoryRecipeRepository(
      [{ id: 1, ingredients: [{ ingredient: 'Parmesan cheese' }, { ingredient: 'parsley' }, { ingredient: 'egg' }] }],
    );
    expect(await suggestIngredients(repo, 'par')).toEqual(['Parmesan cheese', 'parsley']);
  });

  it('normalizes the prefix before searching', async () => {
    const repo = new InMemoryRecipeRepository([{ id: 1, ingredients: [{ ingredient: 'parsley' }] }]);
    expect(await suggestIngredients(repo, '  PAR')).toEqual(['parsley']);
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
