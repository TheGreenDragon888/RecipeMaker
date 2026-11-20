import {
  countBookmarksByFilter,
  newestBookmarksFirst,
  selectBookmarks,
  type SavedRecipe,
} from '../../../src/domain/bookmarks';
import type { ReadinessStatus, RecipeReadiness } from '../../../src/domain/recipeReadiness';

const saved = (id: number, name: string): SavedRecipe => ({
  savedOrder: id,
  recipe: { id, name, totalTimeMinutes: 30, activeTimeMinutes: 30, servingsMin: 4, servingsMax: 4 },
});

const readiness = (status: ReadinessStatus): RecipeReadiness => ({
  status,
  onHandCount: 0,
  neededCount: 0,
  toBuy: [],
  swaps: [],
});

const pasta = saved(1, 'Garlic Butter Pasta');
const stirFry = saved(2, 'Chicken Stir-Fry');
const salmon = saved(3, 'Lemon Salmon');
const stew = saved(4, 'Garlic Beef Stew');
const all = [pasta, stirFry, salmon, stew];
const checks = new Map<number, RecipeReadiness>([
  [1, readiness('ready')],
  [2, readiness('swap')],
  [3, readiness('almost')],
  [4, readiness('needsMore')],
]);
const names = (recipes: SavedRecipe[]) => recipes.map(({ recipe }) => recipe.name);

describe('newestBookmarksFirst', () => {
  it('lists the most recently saved recipe first', () => {
    const bookmarks = [
      { recipeId: 7, savedOrder: 1 },
      { recipeId: 8, savedOrder: 3 },
      { recipeId: 9, savedOrder: 2 },
    ];
    expect(newestBookmarksFirst(bookmarks).map((bookmark) => bookmark.recipeId)).toEqual([8, 9, 7]);
  });

  it('leaves the list it was given as it was', () => {
    const bookmarks = [
      { recipeId: 7, savedOrder: 1 },
      { recipeId: 8, savedOrder: 2 },
    ];
    newestBookmarksFirst(bookmarks);
    expect(bookmarks[0].recipeId).toBe(7);
  });
});

describe('selectBookmarks', () => {
  it('keeps every recipe, in order, under All with no search', () => {
    expect(selectBookmarks(all, { filter: 'all', query: '', readiness: checks })).toEqual(all);
  });

  it.each([
    ['ready', 'Garlic Butter Pasta'],
    ['swap', 'Chicken Stir-Fry'],
    ['almost', 'Lemon Salmon'],
  ] as const)('keeps only the recipes with the %s status', (filter, name) => {
    expect(names(selectBookmarks(all, { filter, query: '', readiness: checks }))).toEqual([name]);
  });

  it('matches the search anywhere in the title', () => {
    expect(names(selectBookmarks(all, { filter: 'all', query: 'beef', readiness: checks }))).toEqual(['Garlic Beef Stew']);
  });

  it('ignores capitals and extra spaces in the search', () => {
    expect(names(selectBookmarks(all, { filter: 'all', query: '  LEMON ', readiness: checks }))).toEqual(['Lemon Salmon']);
  });

  it('applies the search and the filter together', () => {
    expect(names(selectBookmarks(all, { filter: 'ready', query: 'garlic', readiness: checks }))).toEqual([
      'Garlic Butter Pasta',
    ]);
  });

  it('leaves out a recipe with no readiness yet under a status filter', () => {
    expect(selectBookmarks([pasta], { filter: 'ready', query: '', readiness: new Map() })).toEqual([]);
  });

  it('falls back to All when there is no pantry to check against', () => {
    expect(selectBookmarks(all, { filter: 'ready', query: '', readiness: null })).toEqual(all);
  });
});

describe('countBookmarksByFilter', () => {
  it('counts every saved recipe under All', () => {
    expect(countBookmarksByFilter(all, checks).all).toBe(4);
  });

  it('counts each status under its own filter', () => {
    expect(countBookmarksByFilter(all, checks)).toMatchObject({ ready: 1, swap: 1, almost: 1 });
  });

  it('counts a recipe with three or more to buy only under All', () => {
    expect(countBookmarksByFilter([stew], checks)).toEqual({ all: 1, ready: 0, swap: 0, almost: 0 });
  });
});
