// BUSINESS LAYER: the contract services use to read recipe data. Implemented in src/data/.
import type { IngredientUsage, Recipe, RecipeIngredient, RecipeSummary } from './recipe';

export interface RecipeRepository {
  /** Recipes using this ingredient. The name is resolved through the alias table first ("scallions" -> "green onion"). */
  findByIngredient(name: string): Promise<RecipeSummary[]>;
  /** Recipes with any ingredient whose canonical name contains the text. */
  findByIngredientContaining(text: string): Promise<RecipeSummary[]>;
  getRecipe(id: number): Promise<Recipe | null>;
  getIngredients(recipeId: number): Promise<RecipeIngredient[]>;
  listRecipeSummaries(): Promise<RecipeSummary[]>;
  listIngredientUsage(): Promise<IngredientUsage[]>;
  /** Maps each name to its canonical ingredient, or returns it unchanged when there is no alias. */
  resolveIngredientNames(names: string[]): Promise<string[]>;
  /** Canonical ingredient names whose name or alias starts with the prefix, alphabetical. */
  suggestIngredients(prefix: string, limit: number): Promise<string[]>;
  /** The canonical name for an ingredient name or alias (ignoring case), or null when there is no such ingredient. */
  findIngredient(name: string): Promise<string | null>;
  findByDuplicateGroup(group: string): Promise<RecipeSummary[]>;
}
