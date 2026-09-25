import { searchRecipesByIngredient } from '../../../src/services/searchRecipesByIngredient';
import { InMemoryRecipeRepository } from '../../fakes/InMemoryRecipeRepository';

const repo = new InMemoryRecipeRepository(
  [
    { id: 1, name: 'Chickpea Salad', ingredients: [{ ingredient: 'chickpea' }] },
    { id: 2, name: 'Beef Noodle Soup', ingredients: [{ ingredient: 'egg noodle' }] },
    { id: 3, name: 'Toast', ingredients: [{ ingredient: 'bread' }] },
  ],
  { 'chick peas': 'chickpea' },
);

const names = (rs: { name: string }[]) => rs.map((r) => r.name);

describe('searchRecipesByIngredient', () => {
  it('returns recipes that use the exact ingredient', async () => {
    expect(names(await searchRecipesByIngredient(repo, 'bread'))).toEqual(['Toast']);
  });

  it('resolves aliases before searching', async () => {
    expect(names(await searchRecipesByIngredient(repo, 'chick peas'))).toEqual(['Chickpea Salad']);
  });

  it('ignores case and extra whitespace in the search term', async () => {
    expect(names(await searchRecipesByIngredient(repo, '  Chick   PEAS '))).toEqual(['Chickpea Salad']);
  });

  it('falls back to a partial match when nothing matches exactly', async () => {
    expect(names(await searchRecipesByIngredient(repo, 'noodle'))).toEqual(['Beef Noodle Soup']);
  });

  it('returns an empty list for a blank search term', async () => {
    expect(await searchRecipesByIngredient(repo, '   ')).toEqual([]);
  });

  it('returns an empty list when neither exact nor partial search matches', async () => {
    expect(await searchRecipesByIngredient(repo, 'saffron')).toEqual([]);
  });
});
