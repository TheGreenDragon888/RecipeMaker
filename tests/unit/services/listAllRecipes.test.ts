import { listAllRecipes } from '../../../src/services/listAllRecipes';
import { InMemoryRecipeRepository } from '../../fakes/InMemoryRecipeRepository';

const names = (rs: { name: string }[]) => rs.map((r) => r.name);

describe('listAllRecipes', () => {
  it('returns every recipe in the repository', async () => {
    const repo = new InMemoryRecipeRepository([
      { id: 1, name: 'Tacos' },
      { id: 2, name: 'Chili' },
      { id: 3, name: 'Soup' },
    ]);
    expect(await listAllRecipes(repo)).toHaveLength(3);
  });

  it('orders recipes alphabetically by name', async () => {
    const repo = new InMemoryRecipeRepository([
      { id: 1, name: 'Tacos' },
      { id: 2, name: 'chili' },
      { id: 3, name: '15-Minute Curry' },
      { id: 4, name: 'Apple Pie' },
    ]);
    expect(names(await listAllRecipes(repo))).toEqual(['15-Minute Curry', 'Apple Pie', 'chili', 'Tacos']);
  });

  it('returns an empty list when there are no recipes', async () => {
    const repo = new InMemoryRecipeRepository([]);
    expect(await listAllRecipes(repo)).toEqual([]);
  });
});
