// PRESENTATION LAYER: one saved recipe on the Bookmarks screen: the recipe card, with the filled bookmark that removes it.
import React from 'react';
import type { RecipeSummary } from '../../domain/recipe';
import type { RecipeReadiness } from '../../domain/recipeReadiness';
import { RecipeCard } from './RecipeCard';

type Props = {
  recipe: RecipeSummary;
  /** Null while it is being checked, or when there is no pantry to check against. */
  readiness: RecipeReadiness | null;
  onPress: () => void;
  onRemove: () => void;
};

export function BookmarkCard({ recipe, readiness, onPress, onRemove }: Props) {
  return <RecipeCard recipe={recipe} readiness={readiness} onPress={onPress} bookmark={{ saved: true, onToggle: onRemove }} />;
}
