// BUSINESS LAYER: rules for the list of ingredients the user has on hand, and how much of each.
import { normalizeSearchTerm } from './searchTerm';
import { cleanAmount, convertPantryAmount } from './unitConversions';

/**
 * One pantry ingredient and how much the user has, in its pantry unit ("clove", "cup", "each"). The quantity
 * is a whole number until the user sets an amount in the amount sheet; then it can be a fraction (2.0625 cups).
 * The unit is null when it isn't known (its lookup failed); the amount alone is shown then.
 * shownUnit is the unit the user picked to see it in ("tbsp"); it is left out while that is the pantry unit.
 */
export type PantryItem = { name: string; quantity: number; unit: string | null; shownUnit?: string };

/** The most an ingredient can reach, in its pantry unit. */
export const MAX_PANTRY_QUANTITY = 99;

/** Room for floating-point noise when comparing amounts (99 - 1e-12 still counts as the maximum). */
const TOLERANCE = 1e-9;

/** Units too small to step by 1; an item shown in them steps by 1 of its pantry unit instead. */
const UNITS_STEPPED_IN_PANTRY_UNITS = new Set(['ml', 'g']);

/** An amount as the pantry shows it: in the unit the user picked, and whether converting there is approximate. */
export type ShownAmount = { amount: number; unit: string | null; approximate: boolean };

/** The item's amount in the unit the user picked to see it in, or in its pantry unit. */
export function shownPantryAmount(item: PantryItem): ShownAmount {
  if (item.unit !== null && item.shownUnit !== undefined) {
    const conversion = convertPantryAmount(item.name, item.quantity, item.unit, item.shownUnit);
    if (conversion) return { amount: conversion.amount, unit: item.shownUnit, approximate: conversion.approximate };
  }
  return { amount: item.quantity, unit: item.unit, approximate: false };
}

/** The unit one − / + step counts in: the shown unit, or the pantry unit when the shown one is mL or g. */
export function pantryStepUnit(item: PantryItem): string | null {
  const shown = item.shownUnit;
  return shown !== undefined && !UNITS_STEPPED_IN_PANTRY_UNITS.has(shown) ? shown : item.unit;
}

/** One − / + step, in pantry units (1 tbsp of a cup item is 0.0625). */
function stepInPantryUnits(item: PantryItem): number {
  const stepUnit = pantryStepUnit(item);
  if (item.unit === null || stepUnit === null) return 1;
  return convertPantryAmount(item.name, 1, stepUnit, item.unit)?.amount ?? 1;
}

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

/**
 * Raises the named ingredient by one step (see pantryStepUnit), stopping at MAX_PANTRY_QUANTITY instead of
 * going past it. Items are found by name, not position.
 */
export function increasePantryQuantity(pantry: PantryItem[], name: string): PantryItem[] {
  return pantry.map((item) =>
    sameName(item, name) && canIncreasePantryQuantity(item)
      ? { ...item, quantity: cleanAmount(Math.min(MAX_PANTRY_QUANTITY, item.quantity + stepInPantryUnits(item))) }
      : item,
  );
}

/** Lowers the named ingredient by one step; when that leaves nothing, it is removed from the pantry. */
export function decreasePantryQuantity(pantry: PantryItem[], name: string): PantryItem[] {
  return pantry.flatMap((item) => {
    if (!sameName(item, name)) return [item];
    if (decreaseRemovesPantryItem(item)) return [];
    return [{ ...item, quantity: cleanAmount(item.quantity - stepInPantryUnits(item)) }];
  });
}

export function canIncreasePantryQuantity(item: PantryItem): boolean {
  return item.quantity < MAX_PANTRY_QUANTITY - TOLERANCE;
}

/** True when the next decrease takes the ingredient out of the pantry: one step or less is left. */
export function decreaseRemovesPantryItem(item: PantryItem): boolean {
  return item.quantity - stepInPantryUnits(item) <= TOLERANCE;
}

/**
 * Sets the named ingredient's amount, given in `unit`: its pantry unit, or another one it converts to. The
 * amount is kept in the pantry unit, and another unit is remembered as shownUnit. A unit it can't convert to
 * changes nothing. Check the amount with isValidPantryAmount first.
 */
export function setPantryItemAmount(pantry: PantryItem[], name: string, amount: number, unit: string | null): PantryItem[] {
  return pantry.map((item) => {
    if (!sameName(item, name)) return item;
    const { shownUnit: _previous, ...rest } = item;
    if (item.unit === null || unit === null || unit === item.unit) return { ...rest, quantity: cleanAmount(amount) };
    const conversion = convertPantryAmount(item.name, amount, unit, item.unit);
    return conversion ? { ...rest, quantity: cleanAmount(conversion.amount), shownUnit: unit } : item;
  });
}

/** The most the item can hold, given in `unit` (99 cups is 1584 tbsp). */
export function pantryAmountLimit(item: PantryItem, unit: string | null): number {
  if (item.unit === null || unit === null) return MAX_PANTRY_QUANTITY;
  return convertPantryAmount(item.name, MAX_PANTRY_QUANTITY, item.unit, unit)?.amount ?? MAX_PANTRY_QUANTITY;
}

/** Whether an amount typed in the amount sheet can be saved: more than 0, and no more than the limit. */
export function isValidPantryAmount(item: PantryItem, amount: number, unit: string | null): boolean {
  return amount > 0 && amount <= pantryAmountLimit(item, unit) + TOLERANCE;
}

/** The amount sheet's −5 / −1 / +1 / +5 buttons: adds the step, stopping at 0. */
export function stepDraftAmount(amount: number, step: number): number {
  return Math.max(0, cleanAmount(amount + step));
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
