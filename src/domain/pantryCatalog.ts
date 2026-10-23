// BUSINESS LAYER: how each ingredient is kept in the pantry — counted in its unit, or switched on and off.
import { normalizeSearchTerm } from './searchTerm';
import type { SeasoningGroup } from './seasonings';
import { STAPLES } from './staples';

/** One row of the ingredients table: how the pantry tracks a canonical ingredient. */
export type PantryTracking = {
  ingredient: string;
  /** "count": a number in its default unit. "presence": on or off (seasonings and staples). */
  tracking: 'presence' | 'count';
  /** Singular unit ("clove", "cup") for counted ingredients; null for presence ones. */
  defaultUnit: string | null;
};

/** What the Pantry screen loads once: units for the list, and the seasoning tray. */
export type PantryCatalog = {
  /** Pantry unit of each counted ingredient, keyed by its name in lower case. */
  units: Record<string, string>;
  /** The tray's seasonings, grouped into sections (staples left out). */
  seasoningGroups: SeasoningGroup[];
};

export type PantryKind = { kind: 'staple' } | { kind: 'seasoning' } | { kind: 'count'; unit: string | null };

/**
 * How a picked ingredient joins the pantry: a staple (recipes already assume it), a seasoning (its tray switch),
 * or a counted list item with its unit. An ingredient the catalog doesn't know is counted with no unit.
 */
export function pantryKindOf(catalog: PantryCatalog, name: string): PantryKind {
  const key = normalizeSearchTerm(name);
  if (STAPLES.includes(key)) return { kind: 'staple' };
  const inTray = catalog.seasoningGroups.some((group) =>
    group.seasonings.some((seasoning) => normalizeSearchTerm(seasoning) === key),
  );
  if (inTray) return { kind: 'seasoning' };
  return { kind: 'count', unit: catalog.units[key] ?? null };
}
