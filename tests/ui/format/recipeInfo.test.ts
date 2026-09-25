import {
  formatDuration,
  formatServings,
  formatSourceName,
  formatTimes,
  formatYield,
  groupIngredientsByComponent,
} from '../../../src/ui/format/recipeInfo';
import { makeIngredient, makeRecipe } from '../../fakes/InMemoryRecipeRepository';

describe('formatDuration', () => {
  it.each([
    [30, '30 min'],
    [60, '1 hr'],
    [135, '2 hr 15 min'],
    [495, '8 hr 15 min'],
  ])('shows %p minutes as "%s"', (minutes, expected) => {
    expect(formatDuration(minutes)).toBe(expected);
  });
});

describe('formatTimes', () => {
  it('shows one time when active and total are equal', () => {
    expect(formatTimes(makeRecipe({ id: 1, activeTimeMinutes: 30, totalTimeMinutes: 30 }))).toBe('30 min');
  });

  it('shows hands-on and ready-in times when they differ', () => {
    expect(formatTimes(makeRecipe({ id: 1, activeTimeMinutes: 15, totalTimeMinutes: 495 }))).toBe(
      'Hands-on 15 min · Ready in 8 hr 15 min',
    );
  });

  it('prefixes an estimated total time with ≈', () => {
    expect(formatTimes(makeRecipe({ id: 1, activeTimeMinutes: 25, totalTimeMinutes: 25, totalTimeIsEstimated: true }))).toBe('≈25 min');
  });

  it('prefixes an estimated ready-in time with ≈ when the times differ', () => {
    const recipe = makeRecipe({ id: 1, activeTimeMinutes: 100, totalTimeMinutes: 460, totalTimeIsEstimated: true });
    expect(formatTimes(recipe)).toBe('Hands-on 1 hr 40 min · Ready in ≈7 hr 40 min');
  });
});

describe('formatServings', () => {
  it('shows a single number of servings', () => {
    expect(formatServings(makeRecipe({ id: 1, servingsMin: 4, servingsMax: 4 }))).toBe('4');
  });

  it('shows a serving range with an en dash', () => {
    expect(formatServings(makeRecipe({ id: 1, servingsMin: 4, servingsMax: 6 }))).toBe('4–6');
  });

  it('prefixes estimated servings with ≈', () => {
    expect(formatServings(makeRecipe({ id: 1, servingsMin: 8, servingsMax: 8, servingsIsEstimated: true }))).toBe('≈8');
  });
});

describe('formatYield', () => {
  it('describes a yield that is not in servings', () => {
    expect(formatYield(makeRecipe({ id: 1, yieldQuantity: 24, yieldUnit: 'piece' }))).toBe('Makes 24 pieces');
  });

  it('keeps a yield of one singular', () => {
    expect(formatYield(makeRecipe({ id: 1, yieldQuantity: 1, yieldUnit: 'sandwich' }))).toBe('Makes 1 sandwich');
  });

  it('shows nothing when the yield is in servings', () => {
    expect(formatYield(makeRecipe({ id: 1, yieldQuantity: 4, yieldUnit: 'serving' }))).toBeNull();
  });

  it('shows nothing when the yield is unknown', () => {
    expect(formatYield(makeRecipe({ id: 1, yieldQuantity: null, yieldUnit: null }))).toBeNull();
  });
});

describe('formatSourceName', () => {
  it('shows the source site', () => {
    expect(formatSourceName(makeRecipe({ id: 1, sourceSite: 'Budget Bytes' }))).toBe('Budget Bytes');
  });

  it('shows the domain for external sources', () => {
    const recipe = makeRecipe({
      id: 1,
      sourceSite: "External (linked from Carrie's Experimental Kitchen)",
      sourceUrl: 'https://www.sallysbakingaddiction.com/quick-healthy-dinner/',
    });
    expect(formatSourceName(recipe)).toBe('sallysbakingaddiction.com');
  });
});

describe('groupIngredientsByComponent', () => {
  it('groups ingredients by component in first-appearance order', () => {
    const groups = groupIngredientsByComponent([
      makeIngredient({ lineNumber: 1, component: null, ingredient: 'tuna' }),
      makeIngredient({ lineNumber: 2, component: 'sriracha aioli', ingredient: 'mayonnaise' }),
      makeIngredient({ lineNumber: 3, component: null, ingredient: 'egg' }),
      makeIngredient({ lineNumber: 4, component: 'sriracha aioli', ingredient: 'sriracha' }),
    ]);
    expect(groups.map((g) => [g.component, g.ingredients.map((i) => i.ingredient)])).toEqual([
      [null, ['tuna', 'egg']],
      ['sriracha aioli', ['mayonnaise', 'sriracha']],
    ]);
  });
});
