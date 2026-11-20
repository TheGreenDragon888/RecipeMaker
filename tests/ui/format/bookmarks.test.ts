import type { RecipeReadiness } from '../../../src/domain/recipeReadiness';
import {
  formatBookmarkLabel,
  formatBookmarksSummary,
  formatReadinessLabel,
  formatReadinessNote,
  formatRemovedBookmark,
  formatUndoBookmarkLabel,
} from '../../../src/ui/format/bookmarks';

const readiness = (overrides: Partial<RecipeReadiness>): RecipeReadiness => ({
  status: 'ready',
  onHandCount: 8,
  neededCount: 8,
  toBuy: [],
  swaps: [],
  ...overrides,
});

const missing = (...names: string[]) => names.map((ingredient) => ({ ingredient, kind: 'missing' as const }));

describe('formatReadinessLabel', () => {
  it.each([
    ['ready', 'Ready to cook'],
    ['swap', 'Swap available'],
    ['almost', '1-2 items needed'],
  ] as const)('names the %s status', (status, label) => {
    expect(formatReadinessLabel(readiness({ status }))).toBe(label);
  });

  it('counts the items when three or more are needed', () => {
    expect(formatReadinessLabel(readiness({ status: 'needsMore', toBuy: missing('a', 'b', 'c', 'd') }))).toBe('4 items needed');
  });
});

describe('formatReadinessNote', () => {
  it('says everything is on hand', () => {
    expect(formatReadinessNote(readiness({}))).toBe('8/8 ingredients on hand');
  });

  it('uses the singular for a one-ingredient recipe', () => {
    expect(formatReadinessNote(readiness({ onHandCount: 1, neededCount: 1 }))).toBe('1/1 ingredient on hand');
  });

  it('has no note when the recipe has no counted ingredients', () => {
    expect(formatReadinessNote(readiness({ onHandCount: 0, neededCount: 0 }))).toBeNull();
  });

  it('names what to buy', () => {
    const note = formatReadinessNote(readiness({ status: 'almost', onHandCount: 5, neededCount: 7, toBuy: missing('salmon', 'dill') }));
    expect(note).toBe('5/7 · need salmon, dill');
  });

  it('asks for more of an ingredient there is not enough of', () => {
    const note = formatReadinessNote(
      readiness({ status: 'almost', toBuy: [{ ingredient: 'garlic', kind: 'notEnough' }] }),
    );
    expect(note).toBe('8/8 · need more garlic');
  });

  it('names two items to buy, then counts the rest', () => {
    const note = formatReadinessNote(
      readiness({ status: 'needsMore', onHandCount: 3, neededCount: 7, toBuy: missing('salmon', 'dill', 'lemon', 'thyme') }),
    );
    expect(note).toBe('3/7 · need salmon, dill + 2 more');
  });

  it('names a swap', () => {
    const note = formatReadinessNote(
      readiness({ status: 'swap', onHandCount: 7, swaps: [{ ingredient: 'soy sauce', substitute: 'tamari' }] }),
    );
    expect(note).toBe('7/8 · swap tamari for soy sauce');
  });

  it('names two swaps, then counts the rest', () => {
    const swaps = [
      { ingredient: 'soy sauce', substitute: 'tamari' },
      { ingredient: 'rice', substitute: 'quinoa' },
      { ingredient: 'beef', substitute: 'turkey' },
    ];
    expect(formatReadinessNote(readiness({ status: 'swap', onHandCount: 5, swaps }))).toBe(
      '5/8 · swap tamari for soy sauce, quinoa for rice + 1 more',
    );
  });

  it('talks about what to buy when there is also a swap', () => {
    const note = formatReadinessNote(
      readiness({
        status: 'almost',
        onHandCount: 6,
        toBuy: missing('salmon'),
        swaps: [{ ingredient: 'soy sauce', substitute: 'tamari' }],
      }),
    );
    expect(note).toBe('6/8 · need salmon');
  });
});

describe('formatBookmarksSummary', () => {
  it('gives the saved and ready counts', () => {
    expect(formatBookmarksSummary(6, 2)).toBe('6 saved recipes · 2 ready to cook');
  });

  it('uses the singular for one saved recipe', () => {
    expect(formatBookmarksSummary(1, 0)).toBe('1 saved recipe · 0 ready to cook');
  });

  it('leaves out the ready count when there is no pantry to check', () => {
    expect(formatBookmarksSummary(6, null)).toBe('6 saved recipes');
  });
});

describe('bookmark labels', () => {
  it('offers to save a recipe that is not saved', () => {
    expect(formatBookmarkLabel('Chili', false)).toBe('Save Chili');
  });

  it('offers to remove a saved recipe', () => {
    expect(formatBookmarkLabel('Chili', true)).toBe('Remove Chili from bookmarks');
  });

  it('says which recipe was removed', () => {
    expect(formatRemovedBookmark('Chili')).toBe('Removed Chili');
  });

  it('names the recipe Undo brings back, for screen readers', () => {
    expect(formatUndoBookmarkLabel('Chili')).toBe('Undo removing Chili');
  });
});
