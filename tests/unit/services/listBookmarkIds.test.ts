import { listBookmarkIds } from '../../../src/services/listBookmarkIds';
import { InMemoryBookmarkRepository } from '../../fakes/InMemoryBookmarkRepository';

describe('listBookmarkIds', () => {
  it('returns the id of every saved recipe', async () => {
    const repo = new InMemoryBookmarkRepository([
      { recipeId: 4, savedOrder: 1 },
      { recipeId: 9, savedOrder: 2 },
    ]);
    expect(await listBookmarkIds(repo)).toEqual([4, 9]);
  });
});
