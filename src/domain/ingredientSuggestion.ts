// BUSINESS LAYER: a canonical ingredient and the alias that matched the user's prefix, if any.
export type IngredientSuggestion = {
  ingredient: string;
  matchedAlias: string | null;
};
