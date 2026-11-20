import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { recipeHref, recipeIdFromParam } from '../../src/ui/navigation/routeParams';
import { useFocusRefreshKey } from '../../src/ui/navigation/useFocusRefreshKey';
import { useRecipeServices } from '../../src/ui/RecipeServicesContext';
import { RecipeDetailScreen } from '../../src/ui/screens/RecipeDetailScreen';

export default function RecipeRoute() {
  const services = useRecipeServices();
  const { id } = useLocalSearchParams();
  const refreshKey = useFocusRefreshKey();
  return (
    <RecipeDetailScreen
      services={services}
      recipeId={recipeIdFromParam(id)}
      onOpenRecipe={(recipeId) => router.push(recipeHref(recipeId))}
      onBack={() => router.back()}
      // dismissTo unwinds the stack to the Pantry screen, so the pantry list is still there.
      onReturnToPantry={() => router.dismissTo('/')}
      refreshKey={refreshKey}
    />
  );
}
