// PRESENTATION LAYER: browse all recipes or search by title and ingredient. Each card shows how ready the recipe is
// to cook from the saved pantry, once the list has built it, and can be bookmarked from here.
import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, type ListRenderItem, StyleSheet, Text, View } from 'react-native';
import type { RecipeServices } from '../../createRecipeServices';
import type { RecipeSummary } from '../../domain/recipe';
import type { RecipeReadiness } from '../../domain/recipeReadiness';
import { NoticeBar } from '../components/NoticeBar';
import { RecipeCard } from '../components/RecipeCard';
import { SearchField } from '../components/SearchField';
import { StateMessage } from '../components/StateMessage';
import { colors, dock, fonts, fontSize, spacing } from '../theme';
import { useRecipeBookmarks } from '../useRecipeBookmarks';
import { useRecipeReadiness, type RecipeReadinessState } from '../useRecipeReadiness';

const SEARCH_DEBOUNCE_MS = 250;
/**
 * How many cards the list builds around the screen. Every built card redraws when the tab opens, and FlatList's
 * default (10 screens ahead, about 99 cards) made switching to this tab lag; 5 keeps about 2 screens ahead.
 */
const LIST_WINDOW = { initialNumToRender: 8, maxToRenderPerBatch: 8, windowSize: 5 };
const recipeKey = (recipe: RecipeSummary) => String(recipe.id);
type Props = {
  services: RecipeServices;
  onOpenRecipe: (recipeId: number) => void;
  /** Room to leave at the bottom for the tab bar (platform/dockLayout's dockClearance). Defaults to the board's. */
  bottomClearance?: number;
  /** Changes when the screen comes back into view, so bookmarks and pantry changes made elsewhere show here. */
  refreshKey?: number;
};

type Load ={ status: 'loading' } | { status: 'failed' } | { status: 'done'; recipes: RecipeSummary[] };
type SearchLoad =
  | { status: 'idle' | 'loading' | 'failed' }
  | { status: 'done'; recipes: RecipeSummary[] };

type RowProps = {
  recipe: RecipeSummary;
  saved: boolean | null;
  readiness: RecipeReadiness | null;
  watchReadiness: RecipeReadinessState['watch'];
  onOpenRecipe: (recipeId: number) => void;
  onToggleBookmark: (recipeId: number) => void;
};

/**
 * One card in the list. Memoized with stable props, so only the row whose bookmark or readiness changed redraws. The
 * list builds rows only near the screen, so asking from here checks just those recipes.
 */
const RecipeRow = memo(function RecipeRow({
  recipe,
  saved,
  readiness,
  watchReadiness,
  onOpenRecipe,
  onToggleBookmark,
}: RowProps) {
  useEffect(() => watchReadiness([recipe.id]), [watchReadiness, recipe.id]);
  const open = useCallback(() => onOpenRecipe(recipe.id), [onOpenRecipe, recipe.id]);
  const toggle = useCallback(() => onToggleBookmark(recipe.id), [onToggleBookmark, recipe.id]);
  return <RecipeCard recipe={recipe} readiness={readiness} onPress={open} bookmark={{ saved, onToggle: toggle }} />;
});

export function RecipesScreen({ services, onOpenRecipe, bottomClearance = dock.clearance, refreshKey = 0 }: Props) {
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [searchText, setSearchText] = useState('');
  const [searchLoad, setSearchLoad] = useState<SearchLoad>({ status: 'idle' });
  const { savedIds, toggle, saveFailed } = useRecipeBookmarks(services, refreshKey);
  const { readiness, state: readinessState, watch: watchReadiness } = useRecipeReadiness(services, refreshKey);

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

  // The list redraws every card when these change, so they stay the same objects across the screen's redraws
  // (the tab redraws this screen each time it opens).
  const renderItem = useCallback<ListRenderItem<RecipeSummary>>(
    ({ item }) => (
      <RecipeRow
        recipe={item}
        saved={savedIds ? savedIds.has(item.id) : null}
        readiness={readiness.get(item.id) ?? null}
        watchReadiness={watchReadiness}
        onOpenRecipe={onOpenRecipe}
        onToggleBookmark={toggle}
      />
    ),
    [onOpenRecipe, readiness, savedIds, toggle, watchReadiness],
  );
  const listContentStyle = useMemo(() => [styles.listContent, { paddingBottom: bottomClearance }], [bottomClearance]);

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

      <SearchField
        label="Search recipes"
        placeholder="Search all recipes…"
        clearLabel="Clear search"
        value={searchText}
        onChangeText={setSearchText}
      />

      {readinessState === 'failed' ? <Text style={styles.pantryProblem}>Couldn't check your pantry.</Text> : null}

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
          contentContainerStyle={listContentStyle}
          data={visibleRecipes}
          {...LIST_WINDOW}
          keyExtractor={recipeKey}
          renderItem={renderItem}
        />
      )}

      {saveFailed ? <NoticeBar message="Couldn't update your bookmark." bottom={bottomClearance} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: spacing.screenTop, paddingHorizontal: spacing.screen, paddingBottom: spacing.xxs },
  title: { fontFamily: fonts.heading, fontSize: fontSize.screenTitle, color: colors.text },
  pantryProblem: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.screen,
    fontFamily: fonts.regular,
    fontSize: fontSize.caption,
    color: colors.accent,
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
