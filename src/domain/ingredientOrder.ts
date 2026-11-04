// BUSINESS LAYER: the order a recipe's ingredient lines are listed in on the recipe screen: by how each compares
// with the pantry, then seasonings first, then A to Z.
import type { PantryCheck } from './pantryCheck';
import type { RecipeIngredient } from './recipe';
import { normalizeSearchTerm } from './searchTerm';
import { STAPLES } from './staples';

/** Where each status sorts: what you have (staples too) first, then swaps, short, missing, and optional last. */
const STATUS_RANK: Record<PantryCheck['status'], number> = {
  have: 0,
  staple: 0,
  swap: 1,
  notEnough: 2,
  missing: 3,
  optional: 4,
};

/**
 * The lines in the order the recipe screen lists them, as a new array:
 * 1. by status (skipped when `checks` is null, as with no saved pantry);
 * 2. seasonings (the on/off ingredients in `seasonings`, and staples) before other ingredients;
 * 3. by ingredient name, A to Z, ignoring capitals;
 * 4. lines of the same ingredient in the recipe's own order.
 */
export function orderIngredientLines(
  lines: RecipeIngredient[],
  seasonings: ReadonlySet<string>,
  checks: ReadonlyMap<number, PantryCheck> | null,
): RecipeIngredient[] {
  const seasoningKeys = new Set([...seasonings].map(normalizeSearchTerm));
  const statusRank = (line: RecipeIngredient) => {
    const check = checks?.get(line.lineNumber);
    return check ? STATUS_RANK[check.status] : 0;
  };
  const kindRank = (line: RecipeIngredient) => {
    const key = normalizeSearchTerm(line.ingredient);
    return seasoningKeys.has(key) || STAPLES.includes(key) ? 0 : 1;
  };

  return [...lines].sort(
    (a, b) =>
      statusRank(a) - statusRank(b) ||
      kindRank(a) - kindRank(b) ||
      compareNames(a.ingredient, b.ingredient) ||
      a.lineNumber - b.lineNumber,
  );
}

/** A to Z, ignoring capitals. Plain code-point order, so it is the same on every phone whatever its language. */
function compareNames(a: string, b: string): number {
  const [x, y] = [a.toLowerCase(), b.toLowerCase()];
  return x < y ? -1 : x > y ? 1 : 0;
}
