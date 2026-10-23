// BUSINESS LAYER: everything the Pantry screen needs to know about ingredients, loaded once.
import type { RecipeRepository } from '../domain/RecipeRepository';
import type { PantryCatalog } from '../domain/pantryCatalog';
import { groupSeasonings } from '../domain/seasonings';

/** Each counted ingredient's pantry unit, and the on/off ingredients grouped for the seasoning tray. */
export async function getPantryCatalog(repo: RecipeRepository): Promise<PantryCatalog> {
  const rows = await repo.listPantryTracking();
  const units: Record<string, string> = {};
  for (const row of rows) {
    if (row.tracking === 'count' && row.defaultUnit) units[row.ingredient.toLowerCase()] = row.defaultUnit;
  }
  const onOff = rows.filter((row) => row.tracking === 'presence').map((row) => row.ingredient);
  return { units, seasoningGroups: groupSeasonings(onOff) };
}
