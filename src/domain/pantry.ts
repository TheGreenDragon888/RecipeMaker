// BUSINESS LAYER: rules for the list of ingredients the user has on hand, and how many of each.
import { normalizeSearchTerm } from './searchTerm';

/**
 * One pantry ingredient and how many the user has, counted in its pantry unit ("clove", "cup", "each").
 * The unit is null when it isn't known (its lookup failed); the count alone is shown then.
 */
export type PantryItem = { name: string; quantity: number; unit: string | null };

/** The highest count an ingredient can reach. */
export const MAX_PANTRY_QUANTITY = 99;

const sameName = (item: PantryItem, name: string) => normalizeSearchTerm(item.name) === normalizeSearchTerm(name);

/**
 * Adds a typed ingredient to the pantry with a quantity of 1. Blank text and repeats are ignored; a repeat
 * is the same text once normalized ("Tomato " = "tomato"). Aliases are not resolved, so "scallions" and
 * "green onion" are both kept; findRecipesFromPantry resolves them when matching.
 */
export function addPantryItem(pantry: PantryItem[], typed: string, unit: string | null = null): PantryItem[] {
  if (!normalizeSearchTerm(typed) || pantry.some((item) => sameName(item, typed))) return pantry;
  return [...pantry, { name: typed.trim(), quantity: 1, unit }];
}

/** Raises the named ingredient by 1, up to MAX_PANTRY_QUANTITY. Items are found by name, not position. */
export function increasePantryQuantity(pantry: PantryItem[], name: string): PantryItem[] {
  return pantry.map((item) =>
    sameName(item, name) && canIncreasePantryQuantity(item) ? { ...item, quantity: item.quantity + 1 } : item,
  );
}

/** Lowers the named ingredient by 1; going from 1 to 0 removes it from the pantry. */
export function decreasePantryQuantity(pantry: PantryItem[], name: string): PantryItem[] {
  return pantry
    .map((item) => (sameName(item, name) ? { ...item, quantity: item.quantity - 1 } : item))
    .filter((item) => item.quantity > 0);
}

export function canIncreasePantryQuantity(item: PantryItem): boolean {
  return item.quantity < MAX_PANTRY_QUANTITY;
}

/** True when the next decrease takes the ingredient out of the pantry. */
export function decreaseRemovesPantryItem(item: PantryItem): boolean {
  return item.quantity <= 1;
}

/**
 * Switches a seasoning on (added to the end of the list) or off (removed). Seasonings are tracked as on or off,
 * with no count; the list holds the ones that are on. Matching is the same text once normalized, as for items.
 */
export function toggleSeasoning(on: string[], name: string): string[] {
  const term = normalizeSearchTerm(name);
  if (!term) return on;
  const isOn = on.some((seasoning) => normalizeSearchTerm(seasoning) === term);
  return isOn ? on.filter((seasoning) => normalizeSearchTerm(seasoning) !== term) : [...on, name.trim()];
}

/** Everything the user has, for recipe matching: the pantry's ingredients, then the seasonings that are on. */
export function pantryNamesForMatching(pantry: PantryItem[], seasoningsOn: string[]): string[] {
  return [...pantry.map((item) => item.name), ...seasoningsOn];
}

/** Switches a seasoning on; one that is already on stays on (picking it in the add field never turns it off). */
export function turnOnSeasoning(on: string[], name: string): string[] {
  const term = normalizeSearchTerm(name);
  return on.some((seasoning) => normalizeSearchTerm(seasoning) === term) ? on : toggleSeasoning(on, name);
}
