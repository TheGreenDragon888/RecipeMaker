// BUSINESS LAYER: domain models for recipes. Plain TypeScript, no framework or storage imports.

export type RecipeSummary = {
  id: number;
  name: string;
  totalTimeMinutes: number;
  activeTimeMinutes: number;
  servingsMin: number;
  servingsMax: number;
};

export type Recipe = RecipeSummary & {
  sourceSite: string;
  sourceUrl: string;
  totalTimeIsEstimated: boolean;
  servingsIsEstimated: boolean;
  /** What the recipe makes as the source stated it, e.g. 10 "quesadilla". Null when unstated. */
  yieldQuantity: number | null;
  /** Singular unit, e.g. "quesadilla", "cup", "serving". */
  yieldUnit: string | null;
  /** Step text in order, without the leading "1." numbering. */
  steps: string[];
  /** Same dish from different sources shares a group, e.g. "DUP-2 Sloppy Joes". */
  duplicateGroup: string | null;
};

export type RecipeIngredient = {
  lineNumber: number;
  /** Sub-recipe label such as "stir fry sauce". Null means the main recipe. */
  component: string | null;
  /** Canonical, singular ingredient name, e.g. "green onion". */
  ingredient: string;
  /** Null when there is no amount (e.g. unit "to taste"). */
  quantityMin: number | null;
  quantityMax: number | null;
  /** Canonical singular unit, e.g. "cup", "clove", "each", "to taste". */
  unit: string;
  preparation: string | null;
  substitute: string | null;
  isOptional: boolean;
};

/** One ingredient a recipe uses; the minimum needed to decide what a pantry can make. */
export type IngredientUsage = {
  recipeId: number;
  ingredient: string;
  isOptional: boolean;
};
