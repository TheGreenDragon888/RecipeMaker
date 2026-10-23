// BUSINESS LAYER: how the seasoning tray groups the seasonings the user switches on and off.
import { normalizeSearchTerm } from './searchTerm';
import { STAPLES } from './staples';

export type SeasoningSection = 'everyday' | 'spicesAndHerbs' | 'bakingAndExtras';

export type SeasoningGroup = { section: SeasoningSection; seasonings: string[] };

/** The tray's order, top to bottom. */
const SECTION_ORDER: readonly SeasoningSection[] = ['everyday', 'spicesAndHerbs', 'bakingAndExtras'];

/** The board's "Everyday" row, minus its staples (salt, black pepper). */
const EVERYDAY = new Set(['garlic powder', 'onion powder', 'paprika', 'red pepper flakes']);

/** Tracked as on or off like seasonings, but not spices or herbs. */
const BAKING_AND_EXTRAS = new Set([
  'baking powder',
  'brown gravy',
  'hot sauce',
  'lemon zest',
  'rainbow sprinkles',
  'salad bar vegetables',
  'sesame seed',
  'vanilla extract',
]);

function sectionOf(name: string): SeasoningSection {
  const key = normalizeSearchTerm(name);
  if (EVERYDAY.has(key)) return 'everyday';
  if (BAKING_AND_EXTRAS.has(key)) return 'bakingAndExtras';
  return 'spicesAndHerbs';
}

/**
 * Groups seasonings into the tray's sections, in tray order, each sorted A to Z; empty sections are left out.
 * Staples are left out too: recipes assume you always have them, so a switch for them would change nothing.
 */
export function groupSeasonings(names: string[]): SeasoningGroup[] {
  const staples = new Set(STAPLES);
  const shown = names.filter((name) => !staples.has(normalizeSearchTerm(name)));
  return SECTION_ORDER.map((section) => ({
    section,
    seasonings: shown
      .filter((name) => sectionOf(name) === section)
      .sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' })),
  })).filter((group) => group.seasonings.length > 0);
}
