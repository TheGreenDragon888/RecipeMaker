// PRESENTATION LAYER (route "/bookmarks"): the Bookmarks tab. Thin wrapper: services in, navigation out.
import React, { useCallback } from 'react';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { recipeHref } from '../../src/ui/navigation/routeParams';
import { useFocusRefreshKey } from '../../src/ui/navigation/useFocusRefreshKey';
import { dockClearance } from '../../src/ui/platform/dockLayout';
import { useRecipeServices } from '../../src/ui/RecipeServicesContext';
import { BookmarksScreen } from '../../src/ui/screens/BookmarksScreen';

export default function BookmarksRoute() {
  const services = useRecipeServices();
  const insets = useSafeAreaInsets();
  const refreshKey = useFocusRefreshKey();
  // The same function on every redraw, so the list doesn't redraw its cards each time the tab opens.
  const openRecipe = useCallback((recipeId: number) => router.push(recipeHref(recipeId)), []);
  return (
    <BookmarksScreen
      services={services}
      onOpenRecipe={openRecipe}
      onBrowseRecipes={() => router.navigate('/recipes')}
      bottomClearance={dockClearance(insets.bottom)}
      refreshKey={refreshKey}
    />
  );
}
