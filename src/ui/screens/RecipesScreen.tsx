// PRESENTATION LAYER: the Recipes tab — every recipe, in the order listAllRecipes returns them, to browse
// without a pantry. Shown under the tab bar, so the list leaves room for it.
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import type { RecipeServices } from '../../createRecipeServices';
import type { RecipeSummary } from '../../domain/recipe';
import { RecipeCard } from '../components/RecipeCard';
import { StateMessage } from '../components/StateMessage';
import { colors, dock, fonts, fontSize, spacing } from '../theme';

type Props = {
  services: RecipeServices;
  onOpenRecipe: (recipeId: number) => void;
  /** Room to leave at the bottom for the tab bar (platform/dockLayout's tabScreenClearance). Defaults to the board's. */
  bottomClearance?: number;
};

type Load = { status: 'loading' } | { status: 'failed' } | { status: 'done'; recipes: RecipeSummary[] };

export function RecipesScreen({ services, onOpenRecipe, bottomClearance = dock.clearance }: Props) {
  const [load, setLoad] = useState<Load>({ status: 'loading' });

  useEffect(() => {
    // A reply that arrives after the screen is gone must not update it.
    let current = true;
    services.listAllRecipes().then(
      (recipes) => {
        if (current) setLoad({ status: 'done', recipes });
      },
      () => {
        if (current) setLoad({ status: 'failed' });
      },
    );
    return () => {
      current = false;
    };
  }, [services]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Recipes</Text>
      </View>

      {load.status === 'loading' ? (
        <View style={styles.loading}>
          <ActivityIndicator accessibilityLabel="Loading recipes" color={colors.accent} />
        </View>
      ) : load.status === 'failed' ? (
        <StateMessage message="Couldn't load recipes." />
      ) : load.recipes.length === 0 ? (
        <StateMessage message="No recipes yet." />
      ) : (
        <FlatList
          style={styles.list}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomClearance }]}
          data={load.recipes}
          keyExtractor={(recipe) => String(recipe.id)}
          renderItem={({ item }) => <RecipeCard recipe={item} onPress={() => onOpenRecipe(item.id)} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: spacing.screenTop, paddingHorizontal: spacing.screen, paddingBottom: spacing.xxs },
  title: { fontFamily: fonts.heading, fontSize: fontSize.screenTitle, color: colors.text },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { flex: 1 },
  listContent: {
    gap: spacing.lg,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.screen,
    // The bottom padding, set in the JSX, keeps the last card clear of the dock.
  },
});
