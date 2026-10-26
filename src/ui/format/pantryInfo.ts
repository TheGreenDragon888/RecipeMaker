// PRESENTATION LAYER: display text about the user's pantry list and seasoning tray.
import type { PantryRestoreChange } from '../../domain/savedPantry';
import type { SeasoningSection } from '../../domain/seasonings';
import { pluralizeUnit } from './ingredientLine';

/** "Find recipes with 1 ingredient", "Find recipes with 8 ingredients". */
export function formatFindRecipesLabel(count: number): string {
  return `Find recipes with ${count} ${count === 1 ? 'ingredient' : 'ingredients'}`;
}

/** The Results subtitle: "Matched against your 1 pantry ingredient", "... your 8 pantry ingredients". */
export function formatMatchedAgainst(count: number): string {
  return `Matched against your ${count} pantry ${count === 1 ? 'ingredient' : 'ingredients'}`;
}

/** Shown when Done is pressed on text that is neither an ingredient nor the start of one. */
export function formatUnknownIngredient(typed: string): string {
  return `“${typed.trim()}” isn’t in our ingredient list.`;
}

/** An ingredient name as the mockup shows it: "green onion" -> "Green Onion", "all-purpose flour" -> "All-purpose Flour". */
export function formatIngredientName(name: string): string {
  return name.replace(/(^|\s)(\S)/g, (_, space: string, letter: string) => space + letter.toUpperCase());
}

/** How a unit is written when its stored name isn't ("ml" → "mL"). */
const UNIT_LABELS: Record<string, string> = { ml: 'mL', l: 'L' };
/** Units written the same at any amount: "4 each", "250 mL", "2 dozen". */
const NEVER_PLURAL = new Set(['each', 'ml', 'l', 'g', 'kg', 'dozen']);

/**
 * The unit after a pantry amount: "cup" up to 1 ("1/2 cup"), "cups" above; "each", "mL", "g" and "dozen" at
 * any amount; null when the unit isn't known.
 */
export function formatPantryUnit(count: number, unit: string | null): string | null {
  if (unit === null) return null;
  if (NEVER_PLURAL.has(unit) || count <= 1) return UNIT_LABELS[unit] ?? unit;
  return pluralizeUnit(unit);
}

const SECTION_TITLES: Record<SeasoningSection, string> = {
  everyday: 'Everyday',
  spicesAndHerbs: 'Spices & herbs',
  bakingAndExtras: 'Baking & extras',
};

/** A seasoning tray section's heading. */
export function formatSeasoningSection(section: SeasoningSection): string {
  return SECTION_TITLES[section];
}

/**
 * A tray chip's label: "Red Pepper Flakes". A fresh herb reads "Fresh Basil" when the tray also has
 * "dried basil", so the two chips can be told apart.
 */
export function formatSeasoningName(name: string, trayNames: string[]): string {
  const hasDried = trayNames.some((other) => other.toLowerCase() === `dried ${name.toLowerCase()}`);
  return formatIngredientName(hasDried ? `fresh ${name}` : name);
}

/** The closed tray handle's badge: "4 on hand". */
export function formatOnHand(count: number): string {
  return `${count} on hand`;
}

/** The open tray's badge: "4 of 35". */
export function formatTrayCount(on: number, total: number): string {
  return `${on} of ${total}`;
}

/** Shown when a seasoning picked in the add field is switched on in the tray instead of added to the list. */
export function formatSeasoningAdded(name: string): string {
  return `${formatIngredientName(name)} is on in Seasonings.`;
}

/** Shown when a staple is picked in the add field: matching already counts it as on hand. */
export function formatStapleAssumed(name: string): string {
  return `Recipes already assume you have ${name}.`;
}

/** How each kind of restore change ends its part of the notice, in the order the parts are listed. */
const RESTORE_CHANGE_ENDINGS: Record<PantryRestoreChange['kind'], string> = {
  removed: 'removed',
  movedToSeasonings: 'moved to Seasonings',
  movedToList: 'moved to your list',
};

/** "Ale", "Ale and Sumac", "Ale, Sumac and Kale". */
function joinNames(names: string[]): string {
  if (names.length <= 1) return names.join('');
  return `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

/**
 * Shown after the saved pantry loads, when fitting it to new recipe data changed it:
 * "Updated for new recipe data: Ale removed; Cumin moved to Seasonings."
 */
export function formatRestoreChanges(changes: PantryRestoreChange[]): string {
  const kinds = Object.keys(RESTORE_CHANGE_ENDINGS) as PantryRestoreChange['kind'][];
  const parts = kinds.flatMap((kind) => {
    const names = changes.filter((change) => change.kind === kind).map((change) => formatIngredientName(change.name));
    return names.length > 0 ? [`${joinNames(names)} ${RESTORE_CHANGE_ENDINGS[kind]}`] : [];
  });
  return `Updated for new recipe data: ${parts.join('; ')}.`;
}
