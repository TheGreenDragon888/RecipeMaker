import { listBookmarks } from '../../../src/services/listBookmarks';
import { removeBookmark } from '../../../src/services/removeBookmark';
import { restoreBookmark } from '../../../src/services/restoreBookmark';
import { InMemoryBookmarkRepository } from '../../fakes/InMemoryBookmarkRepository';
import { InMemoryRecipeRepository } from '../../fakes/InMemoryRecipeRepository';

describe('restoreBookmark', () => {
  it('puts a removed recipe back in its old place', async () => {
    const recipes = new InMemoryRecipeRepository([{ id: 1 }, { id: 2 }, { id: 3 }]);
    const repo = new InMemoryBookmarkRepository([
      { recipeId: 1, savedOrder: 1 },
      { recipeId: 2, savedOrder: 2 },
      { recipeId: 3, savedOrder: 3 },
    ]);
    await removeBookmark(repo, 2);
    await restoreBookmark(repo, { recipeId: 2, savedOrder: 2 });
    expect((await listBookmarks(repo, recipes)).map(({ recipe }) => recipe.id)).toEqual([3, 2, 1]);
  });
});
