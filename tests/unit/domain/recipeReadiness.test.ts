import type { PantryCheck } from '../../../src/domain/pantryCheck';
import type { RecipeIngredient } from '../../../src/domain/recipe';
import {
  countByReadinessFilter,
  matchesReadinessFilter,
  summarizeReadiness,
  type ReadinessStatus,
  type RecipeReadiness,
} from '../../../src/domain/recipeReadiness';
import { makeIngredient } from '../../fakes/InMemoryRecipeRepository';

const amount = { amount: 1, unit: 'cup', approximate: false };
const have: PantryCheck = { status: 'have', have: amount };
const notEnough: PantryCheck = { status: 'notEnough', have: amount, short: amount };
const missing: PantryCheck = { status: 'missing' };
const swap = (substitute: string): PantryCheck => ({ status: 'swap', substitute, have: amount });

/** A recipe's lines and their checks, from [ingredient, check] pairs, numbered in order. */
function recipe(...rows: [string, PantryCheck, Partial<RecipeIngredient>?][]) {
  const lines = rows.map(([ingredient, , overrides], i) => makeIngredient({ lineNumber: i + 1, ingredient, ...overrides }));
  const checks = new Map(rows.map(([, check], i) => [i + 1, check]));
  return summarizeReadiness(lines, checks);
}

describe('summarizeReadiness', () => {
  describe('status', () => {
    it('is ready when every counted ingredient is on hand in enough quantity', () => {
      expect(recipe(['garlic', have], ['onion', have]).status).toBe('ready');
    });

    it('is swap when nothing needs buying and an ingredient has a swap', () => {
      expect(recipe(['garlic', have], ['soy sauce', swap('tamari')]).status).toBe('swap');
    });

    it('is almost with one ingredient to buy', () => {
      expect(recipe(['garlic', have], ['salmon', missing]).status).toBe('almost');
    });

    it('is almost with two ingredients to buy', () => {
      expect(recipe(['salmon', missing], ['dill', missing]).status).toBe('almost');
    });

    it('is needsMore with three ingredients to buy', () => {
      expect(recipe(['salmon', missing], ['dill', missing], ['lemon', missing]).status).toBe('needsMore');
    });

    it('counts an ingredient there is not enough of as one to buy', () => {
      expect(recipe(['garlic', notEnough], ['onion', have]).status).toBe('almost');
    });

    it('puts something to buy ahead of a swap', () => {
      expect(recipe(['soy sauce', swap('tamari')], ['salmon', missing]).status).toBe('almost');
    });

    it('is ready when the recipe has no counted ingredients', () => {
      expect(recipe(['salt', { status: 'staple' }]).status).toBe('ready');
    });
  });

  describe('counts', () => {
    it('counts have and not-enough ingredients as on hand', () => {
      expect(recipe(['garlic', have], ['onion', notEnough], ['salmon', missing]).onHandCount).toBe(2);
    });

    it('does not count a swapped ingredient as on hand', () => {
      expect(recipe(['garlic', have], ['soy sauce', swap('tamari')]).onHandCount).toBe(1);
    });

    it('counts every required ingredient in the total', () => {
      expect(recipe(['garlic', have], ['soy sauce', swap('tamari')], ['salmon', missing]).neededCount).toBe(3);
    });

    it('leaves staples out of the total', () => {
      expect(recipe(['garlic', have], ['salt', { status: 'staple' }]).neededCount).toBe(1);
    });

    it('leaves optional lines out of the total, even when they are on hand', () => {
      expect(recipe(['garlic', have], ['parsley', have, { isOptional: true }]).neededCount).toBe(1);
    });

    it('leaves a missing optional line out of what to buy', () => {
      expect(recipe(['garlic', have], ['parsley', { status: 'optional' }, { isOptional: true }]).status).toBe('ready');
    });

    it('counts an ingredient on two lines once', () => {
      expect(recipe(['garlic', have], ['Garlic', have]).neededCount).toBe(1);
    });
  });

  describe('an ingredient on several lines', () => {
    it('is missing when any of its lines is missing', () => {
      const result = recipe(['soy sauce', swap('tamari')], ['soy sauce', missing]);
      expect(result.toBuy).toEqual([{ ingredient: 'soy sauce', kind: 'missing' }]);
    });

    it('is not enough when one line is short and another is fine', () => {
      const result = recipe(['garlic', have], ['garlic', notEnough]);
      expect(result.toBuy).toEqual([{ ingredient: 'garlic', kind: 'notEnough' }]);
    });

    it('is listed as a swap only once', () => {
      const result = recipe(['soy sauce', swap('tamari')], ['soy sauce', swap('tamari')]);
      expect(result.swaps).toEqual([{ ingredient: 'soy sauce', substitute: 'tamari' }]);
    });
  });

  describe('what it names', () => {
    it('lists what to buy in recipe order', () => {
      const result = recipe(['salmon', missing], ['garlic', notEnough], ['onion', have]);
      expect(result.toBuy).toEqual([
        { ingredient: 'salmon', kind: 'missing' },
        { ingredient: 'garlic', kind: 'notEnough' },
      ]);
    });

    it('lists each swap with the substitute the recipe names', () => {
      expect(recipe(['soy sauce', swap('tamari')]).swaps).toEqual([{ ingredient: 'soy sauce', substitute: 'tamari' }]);
    });
  });

  it('treats a line without a check as not counted', () => {
    const lines = [makeIngredient({ lineNumber: 1, ingredient: 'garlic' })];
    expect(summarizeReadiness(lines, new Map()).neededCount).toBe(0);
  });
});

describe('readiness filters', () => {
  const withStatus = (status: ReadinessStatus): RecipeReadiness => ({
    status,
    onHandCount: 0,
    neededCount: 0,
    toBuy: [],
    swaps: [],
  });
  const readiness = new Map<number, RecipeReadiness>([
    [1, withStatus('ready')],
    [2, withStatus('swap')],
    [3, withStatus('almost')],
    [4, withStatus('needsMore')],
  ]);
  const items = [1, 2, 3, 4].map((id) => ({ recipe: { id } }));

  describe('countByReadinessFilter', () => {
    it('counts each status under its own filter', () => {
      expect(countByReadinessFilter(items, readiness)).toMatchObject({ ready: 1, swap: 1, almost: 1 });
    });

    it('counts every item under All', () => {
      expect(countByReadinessFilter(items, readiness).all).toBe(4);
    });

    it('counts an item with three or more to buy only under All', () => {
      expect(countByReadinessFilter([{ recipe: { id: 4 } }], readiness)).toEqual({ all: 1, ready: 0, swap: 0, almost: 0 });
    });

    it('counts nothing under a status when there is no pantry to check against', () => {
      expect(countByReadinessFilter(items, null)).toEqual({ all: 4, ready: 0, swap: 0, almost: 0 });
    });
  });

  describe('matchesReadinessFilter', () => {
    it('keeps a recipe with the filter\'s status', () => {
      expect(matchesReadinessFilter(1, 'ready', readiness)).toBe(true);
    });

    it('leaves out a recipe with another status', () => {
      expect(matchesReadinessFilter(2, 'ready', readiness)).toBe(false);
    });

    it('keeps every recipe under All', () => {
      expect(matchesReadinessFilter(4, 'all', readiness)).toBe(true);
    });

    it('leaves out a recipe not checked yet under a status filter', () => {
      expect(matchesReadinessFilter(9, 'ready', readiness)).toBe(false);
    });

    it('keeps every recipe when there is no pantry to check against', () => {
      expect(matchesReadinessFilter(1, 'ready', null)).toBe(true);
    });
  });
});
