// BUSINESS LAYER: the contract services use to read recipe data. Implemented in src/data/.
import type { IngredientUsage, Recipe, RecipeIngredient, RecipeSummary } from './recipe';
import type { IngredientSuggestion } from './ingredientSuggestion';
import type { PantryTracking } from './pantryCatalog';

export interface RecipeRepository {
  /** Recipes using this ingredient. The name is resolved through the alias table first ("scallions" -> "green onion"). */
  findByIngredient(name: string): Promise<RecipeSummary[]>;
  /** Recipes with any canonical ingredient name that contains the text. */
  findByIngredientContaining(text: string): Promise<RecipeSummary[]>;
  /** Recipes with an ingredient name or alias that contains the text. */
  findByIngredientOrAliasContaining(text: string): Promise<RecipeSummary[]>;
  getRecipe(id: number): Promise<Recipe | null>;
  getIngredients(recipeId: number): Promise<RecipeIngredient[]>;
  listRecipeSummaries(): Promise<RecipeSummary[]>;
  listIngredientUsage(): Promise<IngredientUsage[]>;
  /** Maps each name to its canonical ingredient, or returns it unchanged when there is no alias. */
  resolveIngredientNames(names: string[]): Promise<string[]>;
  /**
   * Every canonical ingredient name that contains the text (matchedAlias null), and every alias that contains it
   * (with the alias), ignoring case. In no particular order and with no limit: ranking is the service's job.
   */
  findIngredientMatches(text: string): Promise<IngredientSuggestion[]>;
  /** The canonical name for an ingredient name or alias (ignoring case), or null when there is no such ingredient. */
  findIngredient(name: string): Promise<string | null>;
  findByDuplicateGroup(group: string): Promise<RecipeSummary[]>;
  /** How the pantry tracks every canonical ingredient (the ingredients table), in no particular order. */
  listPantryTracking(): Promise<PantryTracking[]>;
}
