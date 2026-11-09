// PRESENTATION LAYER: browse all recipes or search by title and ingredient, without a pantry.
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import type { RecipeServices } from '../../createRecipeServices';
import type { RecipeSummary } from '../../domain/recipe';
import { Icon } from '../components/Icon';
import { RecipeCard } from '../components/RecipeCard';
import { StateMessage } from '../components/StateMessage';
import { colors, dock, fonts, fontSize, radii, spacing } from '../theme';

const SEARCH_DEBOUNCE_MS = 250;
type Props = {
  services: RecipeServices;
  onOpenRecipe: (recipeId: number) => void;
  /** Room to leave at the bottom for the tab bar (platform/dockLayout's dockClearance). Defaults to the board's. */
  bottomClearance?: number;
};

type Load = { status: 'loading' } | { status: 'failed' } | { status: 'done'; recipes: RecipeSummary[] };
type SearchLoad =
  | { status: 'idle' | 'loading' | 'failed' }
  | { status: 'done'; recipes: RecipeSummary[] };

export function RecipesScreen({ services, onOpenRecipe, bottomClearance = dock.clearance }: Props) {
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [searchText, setSearchText] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchLoad, setSearchLoad] = useState<SearchLoad>({ status: 'idle' });

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

  useEffect(() => {
    if (load.status !== 'done' || !searchText.trim()) {
      setSearchLoad({ status: 'idle' });
      return;
    }

    let current = true;
    setSearchLoad({ status: 'loading' });
    const timeout = setTimeout(() => {
      services.searchRecipes(searchText).then(
        (recipes) => {
          if (current) setSearchLoad({ status: 'done', recipes });
        },
        () => {
          if (current) setSearchLoad({ status: 'failed' });
        },
      );
    }, SEARCH_DEBOUNCE_MS);
    return () => {
      current = false;
      clearTimeout(timeout);
    };
  }, [load.status, searchText, services]);

  const searching = Boolean(searchText.trim());
  const visibleRecipes =
    searching && searchLoad.status === 'done'
      ? searchLoad.recipes
      : load.status === 'done'
        ? load.recipes
        : [];

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>All Recipes</Text>
      </View>

      <View style={[styles.field, searchFocused && styles.fieldFocused]}>
        <Icon name="search" size={18} color={colors.textMuted} />
        <TextInput
          accessibilityLabel="Search recipes"
          autoCapitalize="none"
          autoCorrect={false}
          onBlur={() => setSearchFocused(false)}
          onChangeText={setSearchText}
          onFocus={() => setSearchFocused(true)}
          placeholder="Search all recipes…"
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          style={styles.input}
          value={searchText}
        />
      </View>

      {load.status === 'loading' ? (
        <View style={styles.loading}>
          <ActivityIndicator accessibilityLabel="Loading recipes" color={colors.accent} />
        </View>
      ) : load.status === 'failed' ? (
        <StateMessage message="Couldn't load recipes." />
      ) : searching && searchLoad.status === 'failed' ? (
        <StateMessage message="Couldn't search recipes." />
      ) : searching && searchLoad.status !== 'done' ? (
        <View style={styles.loading}>
          <ActivityIndicator accessibilityLabel="Searching recipes" color={colors.accent} />
        </View>
      ) : visibleRecipes.length === 0 ? (
        <StateMessage message={searching ? 'No recipes found.' : 'No recipes yet.'} />
      ) : (
        <FlatList
          style={styles.list}
          contentContainerStyle={[styles.listContent, { paddingBottom: bottomClearance }]}
          data={visibleRecipes}
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
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    marginHorizontal: spacing.screen,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  fieldFocused: { borderWidth: 1.5, borderColor: colors.accent },
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSize.input,
    color: colors.text,
    paddingVertical: 10,
    paddingHorizontal: 0,
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { flex: 1 },
  listContent: {
    gap: spacing.lg,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.screen,
    // The bottom padding, set in the JSX, keeps the last card clear of the dock.
  },
});
