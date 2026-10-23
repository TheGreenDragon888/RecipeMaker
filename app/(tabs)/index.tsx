// PRESENTATION LAYER (route "/"): the pantry screen. Thin wrapper: services in, navigation out.
import React from 'react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { pantryToParam } from '../../src/ui/navigation/routeParams';
import { dockClearance } from '../../src/ui/platform/dockLayout';
import { useRecipeServices } from '../../src/ui/RecipeServicesContext';
import { PantryScreen } from '../../src/ui/screens/PantryScreen';

export default function IndexRoute() {
  const services = useRecipeServices();
  const insets = useSafeAreaInsets();
  return (
    <PantryScreen
      services={services}
      bottomClearance={dockClearance(insets.bottom)}
      bottomInset={insets.bottom}
      onFindRecipes={(pantry) => router.push({ pathname: '/results', params: { pantry: pantryToParam(pantry) } })}
    />
  );
}
