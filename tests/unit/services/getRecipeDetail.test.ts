import { RecipeNotFoundError } from '../../../src/domain/errors';
import { getRecipeDetail } from '../../../src/services/getRecipeDetail';
import { InMemoryRecipeRepository } from '../../fakes/InMemoryRecipeRepository';

const repo = new InMemoryRecipeRepository([
  { id: 1, name: 'Toast', ingredients: [{ ingredient: 'bread' }, { ingredient: 'butter' }] },
]);

describe('getRecipeDetail', () => {
  it('returns the recipe with its ingredients in line order', async () => {
    const detail = await getRecipeDetail(repo, 1);
    expect(detail.recipe.name).toBe('Toast');
    expect(detail.ingredients.map((i) => i.ingredient)).toEqual(['bread', 'butter']);
  });

  it('throws RecipeNotFoundError when the recipe does not exist', async () => {
    await expect(getRecipeDetail(repo, 999)).rejects.toThrow(RecipeNotFoundError);
  });
});
