// BUSINESS LAYER: the pantry as it was saved, and how it is fitted to the current recipe data when it's loaded.
// A data update can change how an ingredient is kept (counted, a seasoning, a staple) or remove it, so a saved
// pantry is checked against the catalog on every load rather than trusted as it is.
import { addPantryItem, MAX_PANTRY_QUANTITY, turnOnSeasoning, type PantryItem } from './pantry';
import { pantryKindOf, type PantryCatalog } from './pantryCatalog';
import { normalizeSearchTerm } from './searchTerm';
import { cleanAmount, convertPantryAmount, pantryUnitChoices } from './unitConversions';

/** What is kept between launches: the list (each item's unit is the pantry unit it had when saved), and the seasonings that are on. */
export type SavedPantry = { items: PantryItem[]; seasoningsOn: string[] };

/** The saved pantry, ready for the Pantry screen, and what fitting it to the recipe data changed. */
export type RestoredPantry = { pantry: PantryItem[]; seasoningsOn: string[]; changes: PantryRestoreChange[] };

/** Something the restore changed that the user should hear about. Dropped staples aren't reported: nothing is lost. */
export type PantryRestoreChange = { kind: 'removed' | 'movedToSeasonings' | 'movedToList'; name: string };

/** Where an ingredient belongs now: the list (in its pantry unit), the seasoning tray, the staples, or nowhere. */
type Place = { in: 'list'; unit: string } | { in: 'seasonings' } | { in: 'staples' } | { in: 'gone' };

function placeOf(catalog: PantryCatalog, name: string): Place {
  const kind = pantryKindOf(catalog, name);
  if (kind.kind === 'staple') return { in: 'staples' };
  if (kind.kind === 'seasoning') return { in: 'seasonings' };
  return kind.unit === null ? { in: 'gone' } : { in: 'list', unit: kind.unit };
}

/** The saved items worth restoring: a real amount above 0, and only the first of a repeated name. */
function usableItems(items: PantryItem[]): PantryItem[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalizeSearchTerm(item.name);
    if (!Number.isFinite(item.quantity) || item.quantity <= 0 || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/**
 * A saved item in its current pantry unit. When that unit changed, the amount is converted (or reset to 1 when
 * nothing converts it); an item saved without a unit keeps its amount. Either way it is capped at 99. The unit
 * the user picked to see it in is kept only while it is still one of the item's unit choices.
 */
function fitToUnit(item: PantryItem, unit: string): PantryItem {
  const quantity =
    item.unit === null || item.unit === unit
      ? item.quantity
      : (convertPantryAmount(item.name, item.quantity, item.unit, unit)?.amount ?? 1);
  const fitted: PantryItem = { name: item.name, quantity: cleanAmount(Math.min(MAX_PANTRY_QUANTITY, quantity)), unit };
  const { shownUnit } = item;
  const canShow =
    shownUnit !== undefined &&
    shownUnit !== unit &&
    pantryUnitChoices(item.name, unit).some((choice) => choice.unit === shownUnit);
  return canShow ? { ...fitted, shownUnit } : fitted;
}

/**
 * Fits a saved pantry to the recipe data as it is now. Items that are now seasonings switch on in the tray, and
 * seasonings that are now counted join the end of the list at 1 of their pantry unit. Staples are dropped, since
 * matching already assumes them, and so is anything the recipe data no longer has.
 */
export function restoreSavedPantry(saved: SavedPantry, catalog: PantryCatalog): RestoredPantry {
  const items = usableItems(saved.items).map((item) => ({ item, place: placeOf(catalog, item.name) }));
  const seasonings = saved.seasoningsOn.map((name) => ({ name, place: placeOf(catalog, name) }));

  const keptItems = items.flatMap(({ item, place }) => (place.in === 'list' ? [fitToUnit(item, place.unit)] : []));
  const pantry = seasonings.reduce(
    (list, { name, place }) => (place.in === 'list' ? addPantryItem(list, name, place.unit) : list),
    keptItems,
  );

  const seasoningNames = [
    ...seasonings.filter(({ place }) => place.in === 'seasonings').map(({ name }) => name),
    ...items.filter(({ place }) => place.in === 'seasonings').map(({ item }) => item.name),
  ];
  const seasoningsOn = seasoningNames.reduce(turnOnSeasoning, [] as string[]);

  const changes: PantryRestoreChange[] = [
    ...items.flatMap(({ item: { name }, place }): PantryRestoreChange[] => {
      if (place.in === 'gone') return [{ kind: 'removed', name }];
      return place.in === 'seasonings' ? [{ kind: 'movedToSeasonings', name }] : [];
    }),
    ...seasonings.flatMap(({ name, place }): PantryRestoreChange[] => {
      if (place.in === 'gone') return [{ kind: 'removed', name }];
      return place.in === 'list' ? [{ kind: 'movedToList', name }] : [];
    }),
  ];

  return { pantry, seasoningsOn, changes };
}
