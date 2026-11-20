import { removeBookmark } from '../../../src/services/removeBookmark';
import { InMemoryBookmarkRepository } from '../../fakes/InMemoryBookmarkRepository';

describe('removeBookmark', () => {
  it('removes only that recipe', async () => {
    const repo = new InMemoryBookmarkRepository([
      { recipeId: 4, savedOrder: 1 },
      { recipeId: 9, savedOrder: 2 },
    ]);
    await removeBookmark(repo, 4);
    expect(repo.bookmarks).toEqual([{ recipeId: 9, savedOrder: 2 }]);
  });
});
