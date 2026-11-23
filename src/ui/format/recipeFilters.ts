// PRESENTATION LAYER: display text for the Filters sheet, the "N recipes" line and the no-matches message.
import type { RecipeFilter } from '../../domain/recipeFilter';
import { formatDuration } from './recipeInfo';

/** The sheet's hands-on time chips; Any (no limit) is last. */
export const HANDS_ON_CHOICES: { minutes: number | undefined; label: string }[] = [
  { minutes: 15, label: '15 min' },
  { minutes: 30, label: '30 min' },
  { minutes: 45, label: '45 min' },
  { minutes: 60, label: '1 hr' },
  { minutes: undefined, label: 'Any' },
];

/** "15 min or less", "1 hr or less", "Any time". */
export function formatHandsOnLimit(minutes: number | undefined): string {
  return minutes === undefined ? 'Any time' : `${formatDuration(minutes)} or less`;
}

/** "Any", "1 person", "4 people". */
export function formatPeople(people: number | undefined): string {
  if (people === undefined) return 'Any';
  return people === 1 ? '1 person' : `${people} people`;
}

/** "1 recipe", "8 recipes". */
export function formatRecipeCount(count: number): string {
  return count === 1 ? '1 recipe' : `${count} recipes`;
}

/** The sheet's button: "Show 8 recipes", or "Show recipes" while the number is still being worked out. */
export function formatShowRecipes(count: number | null): string {
  return count === null ? 'Show recipes' : `Show ${formatRecipeCount(count)}`;
}

/** What each selected filter is called when it is named in a sentence: "15 min hands-on", "2 people", "Meal Prep". */
export function filterParts(filter: RecipeFilter): string[] {
  return [
    filter.maxActiveMinutes === undefined ? null : `${formatDuration(filter.maxActiveMinutes)} hands-on`,
    filter.people === undefined ? null : formatPeople(filter.people),
    filter.servingRange ? `${filter.servingRange.min}–${filter.servingRange.max} servings` : null,
    filter.mealPrepOnly ? 'Meal Prep' : null,
  ].filter((part): part is string => part !== null);
}

export type TextSegment = { text: string; bold: boolean };

/** "No recipe fits **15 min hands-on** and **Meal Prep** together.", as pieces so the filters can be drawn in bold. */
export function noRecipeFitsSegments(parts: string[]): TextSegment[] {
  const plain = (text: string): TextSegment => ({ text, bold: false });
  const segments: TextSegment[] = [plain('No recipe fits ')];
  parts.forEach((part, index) => {
    if (index > 0) segments.push(plain(index === parts.length - 1 ? ' and ' : ', '));
    segments.push({ text: part, bold: true });
  });
  segments.push(plain(parts.length > 1 ? ' together.' : '.'));
  return segments;
}
