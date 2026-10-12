import React, { useMemo } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { pantryFromParam, recipeHref } from '../src/ui/navigation/routeParams';
import { useRecipeServices } from '../src/ui/RecipeServicesContext';
import { ResultsScreen } from '../src/ui/screens/ResultsScreen';

export default function ResultsRoute() {
  const services = useRecipeServices();
  const { pantry: param } = useLocalSearchParams();
  // Parse once per param value: a new list on every render would make the screen search again.
  const pantry = useMemo(() => pantryFromParam(param), [param]);
  return (
    <ResultsScreen
      services={services}
      pantry={pantry}
      onOpenRecipe={(recipeId) => router.push(recipeHref(recipeId))}
      // dismissTo goes back down the stack to Pantry, or replaces this screen if Pantry isn't there.
      onBack={() => router.dismissTo('/')}
    />
  );
}
