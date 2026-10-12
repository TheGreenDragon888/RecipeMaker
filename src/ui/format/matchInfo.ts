// PRESENTATION LAYER: display text for one pantry match on the Results screen.
import type { PantryMatch } from '../../services/findRecipesFromPantry';

/** "3/5 ingredients on hand", "1/1 ingredient on hand". */
export function formatIngredientsOnHand(match: Pick<PantryMatch, 'haveCount' | 'neededCount'>): string {
  return `${match.haveCount}/${match.neededCount} ${match.neededCount === 1 ? 'ingredient' : 'ingredients'} on hand`;
}
