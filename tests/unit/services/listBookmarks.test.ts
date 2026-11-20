import { listBookmarks } from '../../../src/services/listBookmarks';
import { InMemoryBookmarkRepository } from '../../fakes/InMemoryBookmarkRepository';
import { InMemoryRecipeRepository } from '../../fakes/InMemoryRecipeRepository';

const recipes = new InMemoryRecipeRepository([
  { id: 1, name: 'Pasta' },
  { id: 2, name: 'Stew' },
]);

describe('listBookmarks', () => {
  it('returns nothing when no recipe is saved', async () => {
    expect(await listBookmarks(new InMemoryBookmarkRepository(), recipes)).toEqual([]);
  });

  it('returns the saved recipes, newest first', async () => {
    const bookmarks = new InMemoryBookmarkRepository([
      { recipeId: 1, savedOrder: 1 },
      { recipeId: 2, savedOrder: 2 },
    ]);
    const saved = await listBookmarks(bookmarks, recipes);
    expect(saved.map(({ recipe }) => recipe.name)).toEqual(['Stew', 'Pasta']);
  });

  it('keeps each recipe\'s saved order, so Undo can put it back', async () => {
    const bookmarks = new InMemoryBookmarkRepository([{ recipeId: 2, savedOrder: 5 }]);
    expect((await listBookmarks(bookmarks, recipes))[0].savedOrder).toBe(5);
  });

  it('leaves out a recipe that is no longer in the recipe data', async () => {
    const bookmarks = new InMemoryBookmarkRepository([
      { recipeId: 1, savedOrder: 1 },
      { recipeId: 99, savedOrder: 2 },
    ]);
    expect((await listBookmarks(bookmarks, recipes)).map(({ recipe }) => recipe.id)).toEqual([1]);
  });
});
