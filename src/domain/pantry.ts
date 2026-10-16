// BUSINESS LAYER: rules for the list of ingredients the user has on hand, and how many of each.
import { normalizeSearchTerm } from './searchTerm';

/** One pantry ingredient and how many the user has: a plain count, no unit. */
export type PantryItem = { name: string; quantity: number };

/** The highest count an ingredient can reach. */
export const MAX_PANTRY_QUANTITY = 99;

const sameName = (item: PantryItem, name: string) => normalizeSearchTerm(item.name) === normalizeSearchTerm(name);

/**
 * Adds a typed ingredient to the pantry with a quantity of 1. Blank text and repeats are ignored; a repeat
 * is the same text once normalized ("Tomato " = "tomato"). Aliases are not resolved, so "scallions" and
 * "green onion" are both kept; findRecipesFromPantry resolves them when matching.
 */
export function addPantryItem(pantry: PantryItem[], typed: string): PantryItem[] {
  if (!normalizeSearchTerm(typed) || pantry.some((item) => sameName(item, typed))) return pantry;
  return [...pantry, { name: typed.trim(), quantity: 1 }];
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
