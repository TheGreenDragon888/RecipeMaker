import { RecipeNotFoundError } from '../../../src/domain/errors';
import type { PantryTracking } from '../../../src/domain/pantryCatalog';
import { getRecipeDetail } from '../../../src/services/getRecipeDetail';
import { InMemoryRecipeRepository } from '../../fakes/InMemoryRecipeRepository';

const repo = new InMemoryRecipeRepository([
  { id: 1, name: 'Toast', ingredients: [{ ingredient: 'bread' }, { ingredient: 'butter' }] },
]);

const tracking = (ingredient: string, kind: 'presence' | 'count'): PantryTracking => ({
  ingredient,
  tracking: kind,
  defaultUnit: kind === 'count' ? 'each' : null,
});

/** A recipe using paprika (on/off), salt (on/off, a staple) and potato (counted). */
const seasonedRepo = new InMemoryRecipeRepository(
  [{ id: 1, ingredients: [{ ingredient: 'potato' }, { ingredient: 'paprika' }, { ingredient: 'salt' }] }],
  {},
  [tracking('potato', 'count'), tracking('paprika', 'presence'), tracking('salt', 'presence'), tracking('basil', 'presence')],
);

describe('getRecipeDetail', () => {
  it('returns the recipe with its ingredients in line order', async () => {
    const detail = await getRecipeDetail(repo, 1);
    expect(detail.recipe.name).toBe('Toast');
    expect(detail.ingredients.map((i) => i.ingredient)).toEqual(['bread', 'butter']);
  });

  it('throws RecipeNotFoundError when the recipe does not exist', async () => {
    await expect(getRecipeDetail(repo, 999)).rejects.toThrow(RecipeNotFoundError);
  });

  describe('seasonings', () => {
    it('lists the on/off ingredients the recipe uses', async () => {
      const detail = await getRecipeDetail(seasonedRepo, 1);
      expect(detail.seasonings).toEqual(expect.arrayContaining(['paprika', 'salt']));
    });

    it('leaves out counted ingredients', async () => {
      const detail = await getRecipeDetail(seasonedRepo, 1);
      expect(detail.seasonings).not.toContain('potato');
    });

    it("leaves out on/off ingredients the recipe doesn't use", async () => {
      const detail = await getRecipeDetail(seasonedRepo, 1);
      expect(detail.seasonings).not.toContain('basil');
    });
  });
});
