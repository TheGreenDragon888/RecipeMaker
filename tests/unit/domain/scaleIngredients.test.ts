import { InvalidServingsError } from '../../../src/domain/errors';
import { scaleIngredients } from '../../../src/domain/scaleIngredients';
import { makeIngredient, makeRecipe } from '../../fakes/InMemoryRecipeRepository';

const recipe = makeRecipe({ id: 1, servingsMin: 4, servingsMax: 4 });

describe('scaleIngredients', () => {
  it('multiplies quantities by target people over base servings', () => {
    const [flour] = scaleIngredients(recipe, [makeIngredient({ quantityMin: 2, quantityMax: 2, unit: 'cup' })], 6).ingredients;
    expect([flour.quantityMin, flour.quantityMax]).toEqual([3, 3]);
  });

  it('uses the middle of a serving range as the base', () => {
    const ranged = makeRecipe({ id: 2, servingsMin: 4, servingsMax: 6 });
    const [egg] = scaleIngredients(ranged, [makeIngredient({ quantityMin: 1, quantityMax: 1, unit: 'each' })], 10).ingredients;
    expect(egg.quantityMin).toBe(2);
  });

  it('scales both ends of a quantity range', () => {
    const [soy] = scaleIngredients(recipe, [makeIngredient({ quantityMin: 3, quantityMax: 4, unit: 'tbsp' })], 2).ingredients;
    expect([soy.quantityMin, soy.quantityMax]).toEqual([1.5, 2]);
  });

  it.each(['pinch', 'dash'])('does not scale the unit "%s"', (unit) => {
    const [line] = scaleIngredients(recipe, [makeIngredient({ quantityMin: 1, quantityMax: 1, unit })], 8).ingredients;
    expect([line.quantityMin, line.quantityMax]).toEqual([1, 1]);
  });

  it('leaves ingredients without a quantity unchanged', () => {
    const salt = makeIngredient({ quantityMin: null, quantityMax: null, unit: 'to taste' });
    expect(scaleIngredients(recipe, [salt], 8).ingredients).toEqual([salt]);
  });

  it('marks the result approximate when the servings were estimated', () => {
    const estimated = makeRecipe({ id: 3, servingsIsEstimated: true });
    expect(scaleIngredients(estimated, [], 2).isApproximate).toBe(true);
  });

  it('does not mark the result approximate when the servings were stated', () => {
    expect(scaleIngredients(recipe, [], 2).isApproximate).toBe(false);
  });

  it.each([0, -2, Number.NaN])('throws InvalidServingsError for a target of %p people', (people) => {
    expect(() => scaleIngredients(recipe, [], people)).toThrow(InvalidServingsError);
  });
});
