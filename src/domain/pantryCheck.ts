// BUSINESS LAYER: how each line of a recipe compares with the user's pantry: have it (and enough of it), a swap,
// missing. Results' matching (findRecipesFromPantry) is left as it is: it counts a swap as missing and doesn't
// compare amounts, so "not enough" still counts as on hand there.
import { shownPantryAmount, type PantryItem, type ShownAmount } from './pantry';
import type { RecipeIngredient } from './recipe';
import { normalizeSearchTerm } from './searchTerm';
import { STAPLES } from './staples';
import { convertAmount, type Conversion } from './unitConversions';

/** What the user has on hand: the Pantry list and the seasonings that are switched on. */
export type OnHand = { items: PantryItem[]; seasoningsOn: string[] };

/**
 * One line's check. Amounts are in the line's unit when they convert to it, else as the pantry shows them; a
 * seasoning has none.
 * - have: on hand, and enough of it.
 * - notEnough: on hand, but less than the recipe's lines of it need together; `short` is how much more.
 * - swap: the pantry lacks the ingredient but has the substitute the recipe names ("or sriracha");
 *   `substitute` is the recipe's wording.
 * - staple: assumed on hand, as matching assumes it.
 * - optional: an optional line the pantry lacks; matching doesn't count it, so it isn't missing.
 */
export type PantryCheck =
  | { status: 'have'; have: ShownAmount | null }
  | { status: 'notEnough'; have: ShownAmount; short: ShownAmount }
  | { status: 'swap'; substitute: string; have: ShownAmount | null }
  | { status: 'staple' }
  | { status: 'optional' }
  | { status: 'missing' };

/** Room for floating-point noise: needing 6 tbsp and having 5.9999999999 is still enough. */
const TOLERANCE = 1e-9;

const isStaple = (name: string) => STAPLES.includes(normalizeSearchTerm(name));

/** How many of the item's pantry units one `unit` is (1 cup = 16 tbsp), or null when nothing links them. */
function pantryUnitsPer(item: PantryItem, unit: string): Conversion | null {
  return item.unit === null ? null : convertAmount(item.name, 1, unit, item.unit);
}

/** The item's amount in `unit` when it converts there, else as the pantry shows it. */
function amountIn(item: PantryItem, unit: string): ShownAmount {
  const per = pantryUnitsPer(item, unit);
  return per ? { amount: item.quantity / per.amount, unit, approximate: per.approximate } : shownPantryAmount(item);
}

/** A line's amount in the item's pantry units, when the line counts toward what's needed and converts. */
function neededPantryUnits(line: RecipeIngredient, item: PantryItem): Conversion | null {
  if (line.isOptional || line.quantityMin === null) return null;
  const per = pantryUnitsPer(item, line.unit);
  // A range ("2–3 cloves") needs only its smaller amount.
  return per ? { amount: line.quantityMin * per.amount, approximate: per.approximate } : null;
}

/**
 * Each line's check against the pantry, keyed by the line's number. `substituteNames` gives the ingredient a
 * line's substitute resolves to ("hamburger buns" → "hamburger bun"), by line number; a line left out is
 * looked up by its substitute's own wording.
 */
export function checkRecipeLines(
  lines: RecipeIngredient[],
  onHand: OnHand,
  substituteNames: ReadonlyMap<number, string> = new Map(),
): Map<number, PantryCheck> {
  const items = new Map(onHand.items.map((item) => [normalizeSearchTerm(item.name), item]));
  const seasoningsOn = new Set(onHand.seasoningsOn.map(normalizeSearchTerm));

  // What the recipe needs of each item, all its lines together, in the item's pantry units.
  const needs = new Map<string, Conversion>();
  for (const line of lines) {
    const key = normalizeSearchTerm(line.ingredient);
    const item = items.get(key);
    const need = item && neededPantryUnits(line, item);
    if (!need) continue;
    const total = needs.get(key) ?? { amount: 0, approximate: false };
    needs.set(key, { amount: total.amount + need.amount, approximate: total.approximate || need.approximate });
  }

  /** A line whose ingredient is on the Pantry list: enough of it, or how much is missing. */
  function checkAmount(line: RecipeIngredient, item: PantryItem): PantryCheck {
    const have = amountIn(item, line.unit);
    const need = needs.get(normalizeSearchTerm(line.ingredient));
    // Only a line that counts toward the total can be short (not an optional one, nor one without an amount).
    const per = neededPantryUnits(line, item) ? pantryUnitsPer(item, line.unit) : null;
    if (!need || !per || need.amount - item.quantity <= TOLERANCE) return { status: 'have', have };
    const short = (need.amount - item.quantity) / per.amount;
    return { status: 'notEnough', have, short: { amount: short, unit: line.unit, approximate: need.approximate || per.approximate } };
  }

  /** The substitute's amount on hand, when the pantry has it (null for a staple or a seasoning); undefined when it doesn't. */
  function substituteOnHand(line: RecipeIngredient, substitute: string): ShownAmount | null | undefined {
    const key = normalizeSearchTerm(substituteNames.get(line.lineNumber) ?? substitute);
    const item = items.get(key);
    if (item) return amountIn(item, line.unit);
    return isStaple(key) || seasoningsOn.has(key) ? null : undefined;
  }

  function check(line: RecipeIngredient): PantryCheck {
    const key = normalizeSearchTerm(line.ingredient);
    if (isStaple(key)) return { status: 'staple' };
    const item = items.get(key);
    if (item) return checkAmount(line, item);
    if (seasoningsOn.has(key)) return { status: 'have', have: null };
    if (line.substitute !== null) {
      const have = substituteOnHand(line, line.substitute);
      if (have !== undefined) return { status: 'swap', substitute: line.substitute, have };
    }
    return line.isOptional ? { status: 'optional' } : { status: 'missing' };
  }

  return new Map(lines.map((line) => [line.lineNumber, check(line)]));
}
