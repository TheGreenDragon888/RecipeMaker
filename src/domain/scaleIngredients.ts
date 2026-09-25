// BUSINESS LAYER: scale ingredient amounts to a different number of people.
import { InvalidServingsError } from './errors';
import type { Recipe, RecipeIngredient } from './recipe';

/** Amounts too small or vague to multiply meaningfully. */
const UNSCALED_UNITS = new Set(['pinch', 'dash', 'to taste', 'as needed']);

export type ScaledIngredients = {
  ingredients: RecipeIngredient[];
  /** True when the recipe's servings were estimated, so the scaled amounts are approximate. */
  isApproximate: boolean;
};

export function scaleIngredients(
  recipe: Pick<Recipe, 'servingsMin' | 'servingsMax' | 'servingsIsEstimated'>,
  ingredients: RecipeIngredient[],
  targetPeople: number,
): ScaledIngredients {
  if (!(targetPeople > 0)) throw new InvalidServingsError(targetPeople);

  const base = (recipe.servingsMin + recipe.servingsMax) / 2;
  const factor = targetPeople / base;
  const scale = (q: number | null) => (q === null ? null : q * factor);

  return {
    ingredients: ingredients.map((ing) =>
      UNSCALED_UNITS.has(ing.unit)
        ? ing
        : { ...ing, quantityMin: scale(ing.quantityMin), quantityMax: scale(ing.quantityMax) },
    ),
    isApproximate: recipe.servingsIsEstimated,
  };
}
