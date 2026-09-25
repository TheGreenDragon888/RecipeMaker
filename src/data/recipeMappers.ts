// DATA ACCESS LAYER: row shapes stored in recipes.db and their mapping to domain models.
import type { IngredientUsage, Recipe, RecipeIngredient, RecipeSummary } from '../domain/recipe';

type SqlBool = 0 | 1;

export type RecipeSummaryRow = {
  recipe_id: number;
  recipe_name: string;
  total_time_minutes: number;
  active_time_minutes: number;
  servings_min: number;
  servings_max: number;
};

export type RecipeRow = RecipeSummaryRow & {
  source_site: string;
  source_url: string;
  total_time_is_estimated: SqlBool;
  servings_is_estimated: SqlBool;
  yield_quantity: number | null;
  yield_unit: string | null;
  steps: string;
  duplicate_group: string | null;
};

export type IngredientRow = {
  line_number: number;
  component: string | null;
  ingredient: string;
  quantity_min: number | null;
  quantity_max: number | null;
  unit: string;
  preparation: string | null;
  substitute: string | null;
  is_optional: SqlBool;
};

export type IngredientUsageRow = {
  recipe_id: number;
  ingredient: string;
  is_optional: SqlBool;
};

/** Steps are stored as "1. … | 2. …". */
export function parseSteps(steps: string): string[] {
  return steps.split(' | ').map((s) => s.replace(/^\d+\.\s*/, ''));
}

export const toRecipeSummary = (row: RecipeSummaryRow): RecipeSummary => ({
  id: row.recipe_id,
  name: row.recipe_name,
  totalTimeMinutes: row.total_time_minutes,
  activeTimeMinutes: row.active_time_minutes,
  servingsMin: row.servings_min,
  servingsMax: row.servings_max,
});

export const toRecipe = (row: RecipeRow): Recipe => ({
  ...toRecipeSummary(row),
  sourceSite: row.source_site,
  sourceUrl: row.source_url,
  totalTimeIsEstimated: row.total_time_is_estimated === 1,
  servingsIsEstimated: row.servings_is_estimated === 1,
  yieldQuantity: row.yield_quantity,
  yieldUnit: row.yield_unit,
  steps: parseSteps(row.steps),
  duplicateGroup: row.duplicate_group,
});

export const toRecipeIngredient = (row: IngredientRow): RecipeIngredient => ({
  lineNumber: row.line_number,
  component: row.component,
  ingredient: row.ingredient,
  quantityMin: row.quantity_min,
  quantityMax: row.quantity_max,
  unit: row.unit,
  preparation: row.preparation,
  substitute: row.substitute,
  isOptional: row.is_optional === 1,
});

export const toIngredientUsage = (row: IngredientUsageRow): IngredientUsage => ({
  recipeId: row.recipe_id,
  ingredient: row.ingredient,
  isOptional: row.is_optional === 1,
});
