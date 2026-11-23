// PRESENTATION LAYER (route "/results?pantry=[…]"): "Recipes for You". Thin wrapper: services and the pantry list in,
// navigation out. The root layout leaves this screen's bottom edge unpadded (the Filters sheet stands on it), so the
// route hands the screen the bottom inset to leave room for itself.
import React, { useMemo } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pantryFromParam, recipeHref } from '../src/ui/navigation/routeParams';
import { useFocusRefreshKey } from '../src/ui/navigation/useFocusRefreshKey';
import { useRecipeServices } from '../src/ui/RecipeServicesContext';
import { ResultsScreen } from '../src/ui/screens/ResultsScreen';

export default function ResultsRoute() {
  const services = useRecipeServices();
  const insets = useSafeAreaInsets();
  const { pantry: param } = useLocalSearchParams();
  const refreshKey = useFocusRefreshKey();
  // Parse once per param value: a new list on every render would make the screen search again.
  const pantry = useMemo(() => pantryFromParam(param), [param]);
  return (
    <ResultsScreen
      services={services}
      pantry={pantry}
      onOpenRecipe={(recipeId) => router.push(recipeHref(recipeId))}
      // dismissTo goes back down the stack to Pantry, or replaces this screen if Pantry isn't there.
      onBack={() => router.dismissTo('/')}
      bottomInset={insets.bottom}
      refreshKey={refreshKey}
    />
  );
}
