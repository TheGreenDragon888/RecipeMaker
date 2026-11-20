import { createRecipeServices } from '../../src/createRecipeServices';
import { InMemoryBookmarkRepository } from '../fakes/InMemoryBookmarkRepository';
import { InMemoryPantryRepository } from '../fakes/InMemoryPantryRepository';
import { InMemoryRecipeRepository } from '../fakes/InMemoryRecipeRepository';

const repo = new InMemoryRecipeRepository(
  [
    { id: 1, name: 'Joes A', duplicateGroup: 'DUP', activeTimeMinutes: 10, ingredients: [{ ingredient: 'ground beef' }] },
    { id: 2, name: 'Joes B', duplicateGroup: 'DUP', activeTimeMinutes: 20, ingredients: [{ ingredient: 'ground beef' }] },
  ],
  { beef: 'ground beef' },
  [{ ingredient: 'ground beef', tracking: 'count', defaultUnit: 'lb' }],
  { 'meal prep': [1] },
);
const pantryRepo = new InMemoryPantryRepository({
  items: [{ name: 'beef', quantity: 2, unit: 'lb' }],
  seasoningsOn: [],
});
const bookmarkRepo = new InMemoryBookmarkRepository([{ recipeId: 1, savedOrder: 1 }]);
const services = createRecipeServices(repo, pantryRepo, bookmarkRepo);
const names = (rs: { name: string }[]) => rs.map((r) => r.name);

describe('createRecipeServices', () => {
  it('wires ingredient search to the repository', async () => {
    expect(names(await services.searchRecipesByIngredient('beef'))).toEqual(['Joes A', 'Joes B']);
  });

  it('wires combined recipe search to the repository', async () => {
    expect(names(await services.searchRecipes('beef'))).toEqual(['Joes A', 'Joes B']);
  });

  it('passes recipe filters through combined recipe search', async () => {
    expect(names(await services.searchRecipes('beef', { maxActiveMinutes: 10 }))).toEqual(['Joes A']);
  });

  it('wires pantry matching to the repository', async () => {
    expect(await services.findRecipesFromPantry(['beef'])).toHaveLength(2);
  });

  it('passes pantry result filters through to the matching service', async () => {
    expect(
      names(
        (await services.findRecipesFromPantry(['beef'], {
          servingRange: { min: 4, max: 4 },
          mealPrepOnly: true,
        })).map((match) => match.recipe),
      ),
    ).toEqual(['Joes A']);
  });

  it('wires filtering to the repository', async () => {
    expect(names(await services.filterRecipes({ maxActiveMinutes: 10, people: 1 }))).toEqual(['Joes A']);
  });

  it('wires recipe detail to the repository', async () => {
    expect((await services.getRecipeDetail(2)).recipe.name).toBe('Joes B');
  });

  it('wires similar recipes to the repository', async () => {
    expect(names(await services.getSimilarRecipes(1))).toEqual(['Joes B']);
  });

  it('wires ingredient suggestions to the repository', async () => {
    expect(await services.suggestIngredients('gro')).toEqual([
      { ingredient: 'ground beef', matchedAlias: null },
    ]);
  });

  it('wires ingredient lookup to the repository', async () => {
    expect(await services.findIngredient('beef')).toBe('ground beef');
  });

  it('wires the pantry catalog to the repository', async () => {
    expect((await services.getPantryCatalog()).units).toEqual({ 'ground beef': 'lb' });
  });

  it('wires the full recipe list to the repository', async () => {
    expect(names(await services.listAllRecipes())).toEqual(['Joes A', 'Joes B']);
  });

  it('wires pantry loading to the pantry and recipe repositories', async () => {
    expect((await services.loadSavedPantry()).pantry).toEqual([{ name: 'ground beef', quantity: 2, unit: 'lb' }]);
  });

  it('wires pantry checks to the pantry and recipe repositories', async () => {
    expect((await services.checkRecipeAgainstPantry(1))?.get(1)?.status).toBe('have');
  });

  it('wires pantry saving to the pantry repository', async () => {
    await services.savePantry([], ['paprika']);
    expect(pantryRepo.saved).toEqual({ items: [], seasoningsOn: ['paprika'] });
  });

  describe('bookmarks', () => {
    beforeEach(() => {
      bookmarkRepo.bookmarks = [{ recipeId: 1, savedOrder: 1 }];
    });

    it('wires the saved recipe list to the bookmark and recipe repositories', async () => {
      expect(names((await services.listBookmarks()).map(({ recipe }) => recipe))).toEqual(['Joes A']);
    });

    it('wires the saved ids to the bookmark repository', async () => {
      expect(await services.listBookmarkIds()).toEqual([1]);
    });

    it('wires saving a recipe to the bookmark repository', async () => {
      await services.addBookmark(2);
      expect(await services.listBookmarkIds()).toEqual([1, 2]);
    });

    it('wires removing a recipe to the bookmark repository', async () => {
      await services.removeBookmark(1);
      expect(await services.listBookmarkIds()).toEqual([]);
    });

    it('wires restoring a recipe to the bookmark repository', async () => {
      await services.restoreBookmark({ recipeId: 2, savedOrder: 7 });
      expect(bookmarkRepo.bookmarks).toContainEqual({ recipeId: 2, savedOrder: 7 });
    });

    it('wires readiness to the pantry and recipe repositories', async () => {
      await services.savePantry([{ name: 'ground beef', quantity: 2, unit: 'lb' }], []);
      expect((await services.checkRecipesReadiness([1]))?.get(1)?.status).toBe('ready');
    });
  });
});
