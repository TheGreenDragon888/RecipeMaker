import type { RecipeSummary } from '../../../src/domain/recipe';
import {
  activeFilterCount,
  assertValidRecipeFilter,
  matchesRecipeFilter,
  sameRecipeFilter,
} from '../../../src/domain/recipeFilter';

function summary(overrides: Partial<RecipeSummary> = {}): RecipeSummary {
  return {
    id: 1,
    name: 'Chili',
    totalTimeMinutes: 60,
    activeTimeMinutes: 30,
    servingsMin: 4,
    servingsMax: 4,
    ...overrides,
  };
}

describe('matchesRecipeFilter', () => {
  it('keeps every recipe when nothing is selected', () => {
    expect(matchesRecipeFilter(summary(), {}, null)).toBe(true);
  });

  describe('hands-on time', () => {
    it('keeps a recipe whose active time equals the limit', () => {
      expect(matchesRecipeFilter(summary({ activeTimeMinutes: 15 }), { maxActiveMinutes: 15 }, null)).toBe(true);
    });

    it('drops a recipe whose active time is over the limit', () => {
      expect(matchesRecipeFilter(summary({ activeTimeMinutes: 16 }), { maxActiveMinutes: 15 }, null)).toBe(false);
    });
  });

  describe('serving range', () => {
    const range = { servingRange: { min: 3, max: 5 } };

    it('keeps a recipe inside the range', () => {
      expect(matchesRecipeFilter(summary({ servingsMin: 3, servingsMax: 5 }), range, null)).toBe(true);
    });

    it('keeps a recipe that only touches the range at its smallest serving count', () => {
      expect(matchesRecipeFilter(summary({ servingsMin: 5, servingsMax: 8 }), range, null)).toBe(true);
    });

    it('keeps a recipe that only touches the range at its largest serving count', () => {
      expect(matchesRecipeFilter(summary({ servingsMin: 1, servingsMax: 3 }), range, null)).toBe(true);
    });

    it('drops a recipe that serves fewer people than the range', () => {
      expect(matchesRecipeFilter(summary({ servingsMin: 1, servingsMax: 2 }), range, null)).toBe(false);
    });

    it('drops a recipe that serves more people than the range', () => {
      expect(matchesRecipeFilter(summary({ servingsMin: 6, servingsMax: 8 }), range, null)).toBe(false);
    });
  });

  describe('people', () => {
    it('keeps a recipe that serves at least that many', () => {
      expect(matchesRecipeFilter(summary({ servingsMin: 2, servingsMax: 4 }), { people: 4 }, null)).toBe(true);
    });

    it('drops a recipe whose largest serving count is below that many', () => {
      expect(matchesRecipeFilter(summary({ servingsMin: 1, servingsMax: 1 }), { people: 2 }, null)).toBe(false);
    });
  });

  describe('Meal Prep', () => {
    it('keeps a recipe in the Meal Prep set', () => {
      expect(matchesRecipeFilter(summary({ id: 7 }), { mealPrepOnly: true }, new Set([7]))).toBe(true);
    });

    it('drops a recipe outside the Meal Prep set', () => {
      expect(matchesRecipeFilter(summary({ id: 8 }), { mealPrepOnly: true }, new Set([7]))).toBe(false);
    });

    it('ignores the set when Meal Prep is off', () => {
      expect(matchesRecipeFilter(summary({ id: 8 }), { mealPrepOnly: false }, new Set([7]))).toBe(true);
    });
  });

  it('needs every selected condition to hold', () => {
    const filter = { maxActiveMinutes: 20, people: 4 };
    expect(matchesRecipeFilter(summary({ activeTimeMinutes: 10, servingsMax: 2 }), filter, null)).toBe(false);
  });
});

describe('assertValidRecipeFilter', () => {
  it('accepts an empty filter', () => {
    expect(() => assertValidRecipeFilter({})).not.toThrow();
  });

  it('accepts a full filter', () => {
    expect(() =>
      assertValidRecipeFilter({ servingRange: { min: 2, max: 4 }, maxActiveMinutes: 30, people: 3, mealPrepOnly: true }),
    ).not.toThrow();
  });

  it('rejects a serving range whose minimum is above its maximum', () => {
    expect(() => assertValidRecipeFilter({ servingRange: { min: 5, max: 3 } })).toThrow(RangeError);
  });

  it('rejects a serving range of fractions', () => {
    expect(() => assertValidRecipeFilter({ servingRange: { min: 1.5, max: 3 } })).toThrow(RangeError);
  });

  it('rejects a serving range below 1', () => {
    expect(() => assertValidRecipeFilter({ servingRange: { min: 0, max: 3 } })).toThrow(RangeError);
  });

  it('rejects a maximum active time of 0', () => {
    expect(() => assertValidRecipeFilter({ maxActiveMinutes: 0 })).toThrow(RangeError);
  });

  it('rejects a fractional maximum active time', () => {
    expect(() => assertValidRecipeFilter({ maxActiveMinutes: 7.5 })).toThrow(RangeError);
  });

  it('rejects 0 people', () => {
    expect(() => assertValidRecipeFilter({ people: 0 })).toThrow(RangeError);
  });

  it('rejects a fractional number of people', () => {
    expect(() => assertValidRecipeFilter({ people: 2.5 })).toThrow(RangeError);
  });
});

describe('activeFilterCount', () => {
  it('is 0 for an empty filter', () => {
    expect(activeFilterCount({})).toBe(0);
  });

  it('counts the hands-on time limit', () => {
    expect(activeFilterCount({ maxActiveMinutes: 15 })).toBe(1);
  });

  it('counts the number of people', () => {
    expect(activeFilterCount({ people: 2 })).toBe(1);
  });

  it('counts the serving range', () => {
    expect(activeFilterCount({ servingRange: { min: 2, max: 4 } })).toBe(1);
  });

  it('counts Meal Prep when it is on', () => {
    expect(activeFilterCount({ mealPrepOnly: true })).toBe(1);
  });

  it('does not count Meal Prep when it is off', () => {
    expect(activeFilterCount({ mealPrepOnly: false })).toBe(0);
  });

  it('adds up every selected condition', () => {
    expect(activeFilterCount({ maxActiveMinutes: 15, people: 2, mealPrepOnly: true })).toBe(3);
  });
});

describe('sameRecipeFilter', () => {
  it('treats two empty filters as the same', () => {
    expect(sameRecipeFilter({}, {})).toBe(true);
  });

  it('treats no filter and an empty one as the same', () => {
    expect(sameRecipeFilter(undefined, {})).toBe(true);
  });

  it('does not care what order the conditions were added in', () => {
    expect(sameRecipeFilter({ maxActiveMinutes: 15, people: 2 }, { people: 2, maxActiveMinutes: 15 })).toBe(true);
  });

  it('treats Meal Prep off like Meal Prep not mentioned', () => {
    expect(sameRecipeFilter({ mealPrepOnly: false }, {})).toBe(true);
  });

  it('tells apart different hands-on limits', () => {
    expect(sameRecipeFilter({ maxActiveMinutes: 15 }, { maxActiveMinutes: 30 })).toBe(false);
  });

  it('tells apart a selected condition from none', () => {
    expect(sameRecipeFilter({ people: 2 }, {})).toBe(false);
  });

  it('tells apart different serving ranges', () => {
    expect(sameRecipeFilter({ servingRange: { min: 2, max: 4 } }, { servingRange: { min: 2, max: 5 } })).toBe(false);
  });

  it('treats equal serving ranges as the same', () => {
    expect(sameRecipeFilter({ servingRange: { min: 2, max: 4 } }, { servingRange: { min: 2, max: 4 } })).toBe(true);
  });
});
