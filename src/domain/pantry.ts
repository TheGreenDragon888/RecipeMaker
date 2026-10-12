// BUSINESS LAYER: rules for the list of ingredients the user has on hand.
import { normalizeSearchTerm } from './searchTerm';

/**
 * Adds a typed ingredient to the pantry. Blank text and repeats are ignored; a repeat is the same text
 * once normalized ("Tomato " = "tomato"). Aliases are not resolved, so "scallions" and "green onion"
 * are both kept; findRecipesFromPantry resolves them when matching.
 */
export function addPantryItem(pantry: string[], typed: string): string[] {
  const term = normalizeSearchTerm(typed);
  if (!term || pantry.some((item) => normalizeSearchTerm(item) === term)) return pantry;
  return [...pantry, typed.trim()];
}
