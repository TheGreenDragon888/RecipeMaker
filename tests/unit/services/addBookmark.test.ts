import { addBookmark } from '../../../src/services/addBookmark';
import { InMemoryBookmarkRepository } from '../../fakes/InMemoryBookmarkRepository';

describe('addBookmark', () => {
  it('saves the recipe', async () => {
    const repo = new InMemoryBookmarkRepository();
    await addBookmark(repo, 4);
    expect(repo.bookmarks.map((bookmark) => bookmark.recipeId)).toEqual([4]);
  });

  it('keeps one bookmark when the recipe is saved twice', async () => {
    const repo = new InMemoryBookmarkRepository();
    await addBookmark(repo, 4);
    await addBookmark(repo, 4);
    expect(repo.bookmarks).toHaveLength(1);
  });
});
