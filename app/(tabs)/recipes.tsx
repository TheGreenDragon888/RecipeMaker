// PRESENTATION LAYER (route "/recipes"): the Recipes tab. Thin wrapper: services in, navigation out.
import React from 'react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { recipeHref } from '../../src/ui/navigation/routeParams';
import { dockClearance } from '../../src/ui/platform/dockLayout';
import { useRecipeServices } from '../../src/ui/RecipeServicesContext';
import { RecipesScreen } from '../../src/ui/screens/RecipesScreen';

export default function RecipesRoute() {
  const services = useRecipeServices();
  const insets = useSafeAreaInsets();
  return (
    <RecipesScreen
      services={services}
      onOpenRecipe={(recipeId) => router.push(recipeHref(recipeId))}
      bottomClearance={dockClearance(insets.bottom)}
    />
  );
}
