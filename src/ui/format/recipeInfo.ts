// PRESENTATION LAYER: display text for a recipe's times, servings, yield and source.
import type { Recipe, RecipeIngredient } from '../../domain/recipe';
import { pluralizeName } from './ingredientLine';
import { formatAmount } from './quantity';

const ESTIMATED = '≈';

/** 30 -> "30 min", 60 -> "1 hr", 495 -> "8 hr 15 min". */
export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return [hours > 0 ? `${hours} hr` : '', rest > 0 || hours === 0 ? `${rest} min` : ''].filter(Boolean).join(' ');
}

export function formatTimes(
  recipe: Pick<Recipe, 'activeTimeMinutes' | 'totalTimeMinutes' | 'totalTimeIsEstimated'>,
): string {
  const total = `${recipe.totalTimeIsEstimated ? ESTIMATED : ''}${formatDuration(recipe.totalTimeMinutes)}`;
  if (recipe.activeTimeMinutes === recipe.totalTimeMinutes) return total;
  return `Hands-on ${formatDuration(recipe.activeTimeMinutes)} · Ready in ${total}`;
}

export function formatServings(recipe: Pick<Recipe, 'servingsMin' | 'servingsMax' | 'servingsIsEstimated'>): string {
  const range =
    recipe.servingsMin === recipe.servingsMax ? `${recipe.servingsMin}` : `${recipe.servingsMin}–${recipe.servingsMax}`;
  return `${recipe.servingsIsEstimated ? ESTIMATED : ''}${range}`;
}

/** "Serves 3–4", "Serves ≈8". */
export function formatServes(recipe: Pick<Recipe, 'servingsMin' | 'servingsMax' | 'servingsIsEstimated'>): string {
  return `Serves ${formatServings(recipe)}`;
}

/** "Makes 24 pieces" when the source gave a yield other than servings; otherwise null. */
export function formatYield(recipe: Pick<Recipe, 'yieldQuantity' | 'yieldUnit'>): string | null {
  const { yieldQuantity: quantity, yieldUnit: unit } = recipe;
  if (quantity === null || unit === null || unit === 'serving') return null;
  return `Makes ${formatAmount(quantity)} ${quantity > 1 ? pluralizeName(unit) : unit}`;
}

/** The site name, or the URL's domain for recipes only linked from another site. */
export function formatSourceName(recipe: Pick<Recipe, 'sourceSite' | 'sourceUrl'>): string {
  if (!recipe.sourceSite.startsWith('External')) return recipe.sourceSite;
  return formatSourceDomain(recipe) ?? recipe.sourceSite;
}

/** "budgetbytes.com" from the source URL, or null when the URL has no domain. */
export function formatSourceDomain(recipe: Pick<Recipe, 'sourceUrl'>): string | null {
  return /^https?:\/\/(?:www\.)?([^/]+)/.exec(recipe.sourceUrl)?.[1] ?? null;
}

/** The source link's label: "View on budgetbytes.com". */
export function formatViewSourceLabel(recipe: Pick<Recipe, 'sourceUrl'>): string {
  const domain = formatSourceDomain(recipe);
  return domain ? `View on ${domain}` : 'View the original recipe';
}

/** The sub-heading above a sub-recipe's ingredients: "For the stir fry sauce". */
export function formatIngredientGroupHeading(component: string): string {
  return `For the ${component}`;
}

export type IngredientGroup = {
  /** Null for the main recipe; otherwise a sub-recipe label like "stir fry sauce". */
  component: string | null;
  ingredients: RecipeIngredient[];
};

/** Groups lines by component, keeping the order in which each component first appears. */
export function groupIngredientsByComponent(ingredients: RecipeIngredient[]): IngredientGroup[] {
  const groups = new Map<string | null, RecipeIngredient[]>();
  for (const ing of ingredients) {
    if (!groups.has(ing.component)) groups.set(ing.component, []);
    groups.get(ing.component)!.push(ing);
  }
  return [...groups].map(([component, items]) => ({ component, ingredients: items }));
}
