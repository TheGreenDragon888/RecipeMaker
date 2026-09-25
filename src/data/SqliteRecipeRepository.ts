// DATA ACCESS LAYER: RecipeRepository backed by the bundled, read-only recipes.db.
// Every query binds parameters; user input is never concatenated into SQL.
import type { RecipeRepository } from '../domain/RecipeRepository';
import {
  toIngredientUsage,
  toRecipe,
  toRecipeIngredient,
  toRecipeSummary,
  type IngredientRow,
  type IngredientUsageRow,
  type RecipeRow,
  type RecipeSummaryRow,
} from './recipeMappers';
import type { SqlDatabase } from './SqlDatabase';

const SUMMARY_COLUMNS = String.raw`
  r.recipe_id, r.recipe_name, r.total_time_minutes, r.active_time_minutes, r.servings_min, r.servings_max`;

export const SEARCH_EXACT_SQL = String.raw`
SELECT ${SUMMARY_COLUMNS}
FROM recipes AS r
WHERE r.recipe_id IN (
  SELECT ri.recipe_id FROM recipe_ingredients AS ri
  WHERE ri.ingredient = COALESCE(
    (SELECT a.ingredient FROM ingredient_aliases AS a WHERE a.alias = $term), $term)
)
ORDER BY r.total_time_minutes, r.recipe_name;`;

export const SEARCH_PARTIAL_SQL = String.raw`
SELECT DISTINCT ${SUMMARY_COLUMNS}
FROM recipes AS r JOIN recipe_ingredients AS ri USING (recipe_id)
WHERE ri.ingredient LIKE '%' || $term || '%' ESCAPE '\'
ORDER BY r.recipe_name;`;

export const GET_RECIPE_SQL = `SELECT * FROM recipes WHERE recipe_id = $id;`;

export const GET_INGREDIENTS_SQL = `
SELECT line_number, component, ingredient, quantity_min, quantity_max, unit,
       preparation, substitute, is_optional
FROM recipe_ingredients WHERE recipe_id = $id ORDER BY line_number;`;

export const LIST_SUMMARIES_SQL = `SELECT ${SUMMARY_COLUMNS} FROM recipes AS r ORDER BY r.recipe_id;`;

export const LIST_INGREDIENT_USAGE_SQL = `
SELECT recipe_id, ingredient, is_optional FROM recipe_ingredients ORDER BY recipe_id, line_number;`;

export const RESOLVE_ALIAS_SQL = `SELECT ingredient FROM ingredient_aliases WHERE alias = $name;`;

export const SUGGEST_INGREDIENTS_SQL = String.raw`
SELECT ingredient AS name FROM recipe_ingredients WHERE ingredient LIKE $prefix || '%' ESCAPE '\'
UNION
SELECT ingredient FROM ingredient_aliases WHERE alias LIKE $prefix || '%' ESCAPE '\'
ORDER BY name LIMIT $limit;`;

export const FIND_BY_DUPLICATE_GROUP_SQL = `
SELECT ${SUMMARY_COLUMNS} FROM recipes AS r WHERE r.duplicate_group = $group ORDER BY r.recipe_id;`;

/** Makes %, _ and \ match literally inside a LIKE pattern that uses ESCAPE '\'. */
const escapeLike = (text: string) => text.replace(/[\\%_]/g, '\\$&');

export class SqliteRecipeRepository implements RecipeRepository {
  constructor(private readonly db: SqlDatabase) {}

  async findByIngredient(name: string) {
    const rows = await this.db.getAllAsync<RecipeSummaryRow>(SEARCH_EXACT_SQL, { $term: name });
    return rows.map(toRecipeSummary);
  }

  async findByIngredientContaining(text: string) {
    const rows = await this.db.getAllAsync<RecipeSummaryRow>(SEARCH_PARTIAL_SQL, { $term: escapeLike(text) });
    return rows.map(toRecipeSummary);
  }

  async getRecipe(id: number) {
    const row = await this.db.getFirstAsync<RecipeRow>(GET_RECIPE_SQL, { $id: id });
    return row ? toRecipe(row) : null;
  }

  async getIngredients(recipeId: number) {
    const rows = await this.db.getAllAsync<IngredientRow>(GET_INGREDIENTS_SQL, { $id: recipeId });
    return rows.map(toRecipeIngredient);
  }

  async listRecipeSummaries() {
    const rows = await this.db.getAllAsync<RecipeSummaryRow>(LIST_SUMMARIES_SQL, {});
    return rows.map(toRecipeSummary);
  }

  async listIngredientUsage() {
    const rows = await this.db.getAllAsync<IngredientUsageRow>(LIST_INGREDIENT_USAGE_SQL, {});
    return rows.map(toIngredientUsage);
  }

  async resolveIngredientNames(names: string[]) {
    return Promise.all(
      names.map(async (name) => {
        const row = await this.db.getFirstAsync<{ ingredient: string }>(RESOLVE_ALIAS_SQL, { $name: name });
        return row?.ingredient ?? name;
      }),
    );
  }

  async suggestIngredients(prefix: string, limit: number) {
    const rows = await this.db.getAllAsync<{ name: string }>(SUGGEST_INGREDIENTS_SQL, {
      $prefix: escapeLike(prefix),
      $limit: limit,
    });
    return rows.map((r) => r.name);
  }

  async findByDuplicateGroup(group: string) {
    const rows = await this.db.getAllAsync<RecipeSummaryRow>(FIND_BY_DUPLICATE_GROUP_SQL, { $group: group });
    return rows.map(toRecipeSummary);
  }
}
