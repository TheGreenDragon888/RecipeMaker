// BUSINESS LAYER: how ready a whole recipe is to cook from the pantry, built from its lines' pantry checks, and which
// recipes each filter chip holds. The counts agree with Results (see tests/integration/pantryCheckAgreement.test.ts):
// an ingredient there isn't enough of counts as on hand, and a swapped one doesn't.
import type { PantryCheck } from './pantryCheck';
import type { RecipeIngredient } from './recipe';

/**
 * - ready: everything on hand, in enough quantity.
 * - swap: nothing to buy, but at least one ingredient needs its substitute.
 * - almost: one or two ingredients to buy.
 * - needsMore: three or more to buy.
 */
export type ReadinessStatus = 'ready' | 'swap' | 'almost' | 'needsMore';

export type IngredientToBuy = { ingredient: string; kind: 'missing' | 'notEnough' };
export type IngredientSwap = { ingredient: string; substitute: string };

export type RecipeReadiness = {
  status: ReadinessStatus;
  /** Distinct required ingredients the pantry has, even if too little of them. */
  onHandCount: number;
  /** Distinct required ingredients, leaving out optional lines and staples. */
  neededCount: number;
  /** In recipe order. */
  toBuy: IngredientToBuy[];
  /** In recipe order. */
  swaps: IngredientSwap[];
};

/** Each recipe's readiness by id. */
export type ReadinessById = ReadonlyMap<number, RecipeReadiness>;

/** The filter chips. A recipe with three or more to buy shows only under All. */
export type ReadinessFilter = 'all' | 'ready' | 'swap' | 'almost';

/** The most ingredients to buy for a recipe to still be "almost there". */
const ALMOST_THERE_MAX = 2;

type CountedCheck = Extract<PantryCheck, { status: 'have' | 'notEnough' | 'swap' | 'missing' }>;

/** When one ingredient's lines differ, the higher rank decides what the ingredient counts as. */
const RANK: Record<CountedCheck['status'], number> = { have: 0, swap: 1, notEnough: 2, missing: 3 };

function isCounted(check: PantryCheck | undefined): check is CountedCheck {
  return check !== undefined && check.status !== 'staple' && check.status !== 'optional';
}

function statusFor(toBuy: number, swaps: number): ReadinessStatus {
  if (toBuy > ALMOST_THERE_MAX) return 'needsMore';
  if (toBuy > 0) return 'almost';
  return swaps > 0 ? 'swap' : 'ready';
}

export function summarizeReadiness(
  lines: RecipeIngredient[],
  checks: ReadonlyMap<number, PantryCheck>,
): RecipeReadiness {
  // A Map keeps each ingredient where the recipe first lists it.
  const worst = new Map<string, { ingredient: string; check: CountedCheck }>();
  for (const line of lines) {
    const check = checks.get(line.lineNumber);
    if (line.isOptional || !isCounted(check)) continue;
    const key = line.ingredient.toLowerCase();
    const seen = worst.get(key);
    if (!seen) worst.set(key, { ingredient: line.ingredient, check });
    else if (RANK[check.status] > RANK[seen.check.status]) seen.check = check;
  }

  const toBuy: IngredientToBuy[] = [];
  const swaps: IngredientSwap[] = [];
  let onHandCount = 0;
  for (const { ingredient, check } of worst.values()) {
    if (check.status === 'have' || check.status === 'notEnough') onHandCount += 1;
    if (check.status === 'missing' || check.status === 'notEnough') toBuy.push({ ingredient, kind: check.status });
    if (check.status === 'swap') swaps.push({ ingredient, substitute: check.substitute });
  }

  return {
    status: statusFor(toBuy.length, swaps.length),
    onHandCount,
    neededCount: worst.size,
    toBuy,
    swaps,
  };
}

/** Whether a recipe shows under a filter. `readiness` is null when there is no pantry to check against, which leaves only All. */
export function matchesReadinessFilter(recipeId: number, filter: ReadinessFilter, readiness: ReadinessById | null): boolean {
  return filter === 'all' || readiness === null || readiness.get(recipeId)?.status === filter;
}

/** How many of the items each filter holds. */
export function countByReadinessFilter(
  items: readonly { recipe: { id: number } }[],
  readiness: ReadinessById | null,
): Record<ReadinessFilter, number> {
  const withStatus = (status: ReadinessFilter) =>
    items.filter(({ recipe }) => readiness?.get(recipe.id)?.status === status).length;
  return { all: items.length, ready: withStatus('ready'), swap: withStatus('swap'), almost: withStatus('almost') };
}
