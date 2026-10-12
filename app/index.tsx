// PRESENTATION LAYER (route "/"): the pantry screen. Thin wrapper: services in, navigation out.
import React from 'react';
import { router } from 'expo-router';
import { pantryToParam } from '../src/ui/navigation/routeParams';
import { useRecipeServices } from '../src/ui/RecipeServicesContext';
import { PantryScreen } from '../src/ui/screens/PantryScreen';

export default function IndexRoute() {
  const services = useRecipeServices();
  return (
    <PantryScreen
      services={services}
      onFindRecipes={(pantry) => router.push({ pathname: '/results', params: { pantry: pantryToParam(pantry) } })}
    />
  );
}
