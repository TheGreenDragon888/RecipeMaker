import { orderIngredientLines } from '../../../src/domain/ingredientOrder';
import type { PantryCheck } from '../../../src/domain/pantryCheck';
import type { RecipeIngredient } from '../../../src/domain/recipe';
import { makeIngredient } from '../../fakes/InMemoryRecipeRepository';

const HAVE: PantryCheck = { status: 'have', have: null };
const SWAP: PantryCheck = { status: 'swap', substitute: 'sriracha', have: null };
const NOT_ENOUGH: PantryCheck = {
  status: 'notEnough',
  have: { amount: 1, unit: 'cup', approximate: false },
  short: { amount: 1, unit: 'cup', approximate: false },
};
const MISSING: PantryCheck = { status: 'missing' };
const OPTIONAL: PantryCheck = { status: 'optional' };
const STAPLE: PantryCheck = { status: 'staple' };

/** Lines named in the order given, numbered from 1, each with its check. */
function linesWith(...entries: [string, PantryCheck][]) {
  const lines = entries.map(([ingredient], i) => makeIngredient({ lineNumber: i + 1, ingredient }));
  const checks = new Map(entries.map(([, check], i) => [i + 1, check]));
  return { lines, checks };
}

const names = (lines: RecipeIngredient[]) => lines.map((line) => line.ingredient);

describe('orderIngredientLines', () => {
  describe('by status', () => {
    it('puts a line you have before a swap', () => {
      const { lines, checks } = linesWith(['apple', SWAP], ['banana', HAVE]);
      expect(names(orderIngredientLines(lines, new Set(), checks))).toEqual(['banana', 'apple']);
    });

    it('puts a swap before a line you have too little of', () => {
      const { lines, checks } = linesWith(['apple', NOT_ENOUGH], ['banana', SWAP]);
      expect(names(orderIngredientLines(lines, new Set(), checks))).toEqual(['banana', 'apple']);
    });

    it('puts a line you have too little of before a missing one', () => {
      const { lines, checks } = linesWith(['apple', MISSING], ['banana', NOT_ENOUGH]);
      expect(names(orderIngredientLines(lines, new Set(), checks))).toEqual(['banana', 'apple']);
    });

    it('puts a missing line before an optional one', () => {
      const { lines, checks } = linesWith(['apple', OPTIONAL], ['banana', MISSING]);
      expect(names(orderIngredientLines(lines, new Set(), checks))).toEqual(['banana', 'apple']);
    });

    it('sorts a staple together with the lines you have', () => {
      const { lines, checks } = linesWith(['apple', HAVE], ['celery', HAVE], ['salt', STAPLE], ['banana', SWAP]);
      const seasonings = new Set(['salt']);
      expect(names(orderIngredientLines(lines, seasonings, checks))).toEqual(['salt', 'apple', 'celery', 'banana']);
    });
  });

  describe('seasonings first', () => {
    it('puts a seasoning before other ingredients with the same status', () => {
      const { lines, checks } = linesWith(['apple', HAVE], ['paprika', HAVE]);
      expect(names(orderIngredientLines(lines, new Set(['paprika']), checks))).toEqual(['paprika', 'apple']);
    });

    it('counts a staple as a seasoning', () => {
      const { lines, checks } = linesWith(['apple', HAVE], ['salt', STAPLE]);
      expect(names(orderIngredientLines(lines, new Set(), checks))).toEqual(['salt', 'apple']);
    });

    it('keeps a seasoning in its own status group', () => {
      const { lines, checks } = linesWith(['paprika', MISSING], ['apple', HAVE]);
      expect(names(orderIngredientLines(lines, new Set(['paprika']), checks))).toEqual(['apple', 'paprika']);
    });

    it('matches seasoning names ignoring capitals', () => {
      const { lines, checks } = linesWith(['apple', HAVE], ['paprika', HAVE]);
      expect(names(orderIngredientLines(lines, new Set(['Paprika']), checks))).toEqual(['paprika', 'apple']);
    });
  });

  describe('A to Z', () => {
    it('sorts lines with the same status and kind by ingredient name', () => {
      const { lines, checks } = linesWith(['carrot', HAVE], ['apple', HAVE], ['banana', HAVE]);
      expect(names(orderIngredientLines(lines, new Set(), checks))).toEqual(['apple', 'banana', 'carrot']);
    });

    it('ignores capitals', () => {
      const { lines, checks } = linesWith(['banana', HAVE], ['Apple', HAVE], ['cherry', HAVE]);
      expect(names(orderIngredientLines(lines, new Set(), checks))).toEqual(['Apple', 'banana', 'cherry']);
    });

    it('keeps the recipe order of lines with the same ingredient', () => {
      const lines = [
        makeIngredient({ lineNumber: 1, ingredient: 'onion', preparation: 'sliced' }),
        makeIngredient({ lineNumber: 2, ingredient: 'apple' }),
        makeIngredient({ lineNumber: 3, ingredient: 'onion', preparation: 'diced' }),
      ];
      const checks = new Map([[1, HAVE], [2, HAVE], [3, HAVE]]);
      const ordered = orderIngredientLines(lines, new Set(), checks);
      expect(ordered.map((line) => line.lineNumber)).toEqual([2, 1, 3]);
    });
  });

  describe('with no pantry checks', () => {
    it('puts seasonings first, then sorts A to Z', () => {
      const lines = ['carrot', 'paprika', 'apple', 'basil'].map((ingredient, i) => makeIngredient({ lineNumber: i + 1, ingredient }));
      const ordered = orderIngredientLines(lines, new Set(['paprika', 'basil']), null);
      expect(names(ordered)).toEqual(['basil', 'paprika', 'apple', 'carrot']);
    });
  });

  it('leaves the lines it was given in their order', () => {
    const { lines, checks } = linesWith(['banana', HAVE], ['apple', HAVE]);
    orderIngredientLines(lines, new Set(), checks);
    expect(names(lines)).toEqual(['banana', 'apple']);
  });
});
