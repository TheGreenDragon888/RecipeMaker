// PRESENTATION LAYER: browse, search, and filter all recipes, without a pantry. The Filters button beside the search
// field opens the board's Filters sheet (hands-on time, number of people, Meal Prep); closing it applies the choices.
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, type ListRenderItem, StyleSheet, Text, TextInput, View } from 'react-native';
import type { RecipeServices } from '../../createRecipeServices';
import type { RecipeSummary } from '../../domain/recipe';
import { activeFilterCount, type RecipeFilter } from '../../domain/recipeFilter';
import type { RecipeReadiness } from '../../domain/recipeReadiness';
import { ClearFieldButton } from '../components/ClearFieldButton';
import { FilterNoMatches } from '../components/FilterNoMatches';
import { FiltersButton } from '../components/FiltersButton';
import { FiltersSheet } from '../components/FiltersSheet';
import { Icon } from '../components/Icon';
import { NoticeBar } from '../components/NoticeBar';
import { RecipeCard } from '../components/RecipeCard';
import { StateMessage } from '../components/StateMessage';
import { TapAwayToDismiss } from '../components/TapAwayToDismiss';
import { filterParts, formatRecipeCount } from '../format/recipeFilters';
import { dockSpot } from '../platform/dockLayout';
import { colors, dock, fonts, fontSize, radii, spacing } from '../theme';
import { useRecipeBookmarks } from '../useRecipeBookmarks';
import { useRecipeFilters } from '../useRecipeFilters';
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
  /** The safe area's bottom inset: where the dock sits, and the room the Filters sheet leaves under its content. */
  bottomInset?: number;
  /** Called with true while the Filters sheet is over the dock's spot, so the tabs layout can move the dock away. */
  onSheetShownChange?: (shown: boolean) => void;
  /** Changes when the screen comes back into view, so bookmarks and pantry changes made elsewhere show here. */
  refreshKey?: number;
};

type Load = { status: 'loading' } | { status: 'failed' } | { status: 'done'; recipes: RecipeSummary[] };
type SearchLoad =
  | { status: 'idle' | 'loading' | 'failed' }
  | { status: 'done'; recipes: RecipeSummary[] };
type FilterLoad =
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

export function RecipesScreen({
  services,
  onOpenRecipe,
  bottomClearance = dock.clearance,
  bottomInset = 0,
  onSheetShownChange,
  refreshKey = 0,
}: Props) {
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [searchText, setSearchText] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchLoad, setSearchLoad] = useState<SearchLoad>({ status: 'idle' });
  const [filterLoad, setFilterLoad] = useState<FilterLoad>({ status: 'idle' });
  /** Whether the Filters sheet is over the dock's spot as it moves. */
  const [sheetCoversDock, setSheetCoversDock] = useState(false);
  const { savedIds, toggle, saveFailed } = useRecipeBookmarks(services, refreshKey);
  const { readiness, state: readinessState, watch: watchReadiness } = useRecipeReadiness(services, refreshKey);

  // How many recipes a set of choices in the Filters sheet would show, counted the way the list is: a search first.
  const countFor = useCallback(
    async (draft: RecipeFilter) => {
      const filtered = activeFilterCount(draft) > 0;
      if (searchText.trim()) {
        const found = await (filtered ? services.searchRecipes(searchText, draft) : services.searchRecipes(searchText));
        return found.length;
      }
      if (!filtered) return load.status === 'done' ? load.recipes.length : 0;
      return (await services.filterRecipes(draft)).length;
    },
    [load, searchText, services],
  );
  const filters = useRecipeFilters(countFor);
  const appliedFilters = filters.applied;
  const filtersActive = filters.activeCount > 0;
  const spot = useMemo(() => dockSpot(bottomInset), [bottomInset]);

  // While the sheet is over the dock's spot, the dock must move out of its way; it comes back as soon as the sheet
  // leaves it room. Leaving with the sheet open (the screen goes away) must not leave the dock hidden.
  const latestOnSheetShownChange = useRef(onSheetShownChange);
  latestOnSheetShownChange.current = onSheetShownChange;
  useEffect(() => {
    latestOnSheetShownChange.current?.(sheetCoversDock);
  }, [sheetCoversDock]);
  useEffect(() => () => latestOnSheetShownChange.current?.(false), []);

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
      setSearchLoad((current) => (current.status === 'idle' ? current : { status: 'idle' }));
      return;
    }

    let current = true;
    setSearchLoad({ status: 'loading' });
    const timeout = setTimeout(() => {
      const request = appliedFilters
        ? services.searchRecipes(searchText, appliedFilters)
        : services.searchRecipes(searchText);
      request.then(
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
  }, [appliedFilters, load.status, searchText, services]);

  useEffect(() => {
    if (!appliedFilters || searchText.trim()) {
      return;
    }

    let current = true;
    setFilterLoad({ status: 'loading' });
    services.filterRecipes(appliedFilters).then(
      (recipes) => {
        if (current) setFilterLoad({ status: 'done', recipes });
      },
      () => {
        if (current) setFilterLoad({ status: 'failed' });
      },
    );
    return () => {
      current = false;
    };
  }, [appliedFilters, searchText, services]);

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
      : filtersActive && filterLoad.status === 'done'
        ? filterLoad.recipes
      : load.status === 'done'
        ? load.recipes
        : [];

  return (
    <TapAwayToDismiss style={styles.screen} testID="recipes-screen">
      <View style={styles.header}>
        <Text style={styles.title}>All Recipes</Text>
        <Text style={styles.subtitle}>Every recipe in RecipeMaker</Text>
      </View>

      <View style={styles.searchRow}>
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
          {searchText ? <ClearFieldButton label="Clear search" onPress={() => setSearchText('')} /> : null}
        </View>
        <FiltersButton activeCount={filters.activeCount} onPress={filters.show} />
      </View>

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
      ) : filtersActive && !searching && filterLoad.status === 'failed' ? (
        <StateMessage message="Couldn't load recipes." />
      ) : filtersActive && !searching && filterLoad.status !== 'done' ? (
        <View style={styles.loading}>
          <ActivityIndicator accessibilityLabel="Loading filtered recipes" color={colors.accent} />
        </View>
      ) : visibleRecipes.length === 0 ? (
        searching ? (
          <StateMessage message="No recipes found." />
        ) : filtersActive && appliedFilters ? (
          <FilterNoMatches parts={filterParts(appliedFilters)} />
        ) : (
          <StateMessage message="No recipes yet." />
        )
      ) : (
        <>
          <Text style={styles.count}>{formatRecipeCount(visibleRecipes.length)}</Text>
          <FlatList
            style={styles.list}
            contentContainerStyle={listContentStyle}
            data={visibleRecipes}
            {...LIST_WINDOW}
            keyExtractor={recipeKey}
            renderItem={renderItem}
          />
        </>
      )}
      {saveFailed ? <NoticeBar message="Couldn't update your bookmark." bottom={bottomClearance} /> : null}

      <FiltersSheet
        open={filters.open}
        bottomInset={bottomInset}
        value={appliedFilters ?? NO_FILTERS}
        count={filters.count}
        onChange={filters.onChange}
        onClose={filters.onClose}
        dockSpot={spot}
        onCoversDockChange={setSheetCoversDock}
      />
    </TapAwayToDismiss>
  );
}

const NO_FILTERS: RecipeFilter = {};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: spacing.screenTop, paddingHorizontal: spacing.screen, paddingBottom: spacing.xxs },
  title: { fontFamily: fonts.heading, fontSize: fontSize.screenTitle, color: colors.text },
  subtitle: { marginTop: spacing.xs, fontFamily: fonts.regular, fontSize: fontSize.body, color: colors.textSecondary },
  pantryProblem: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.screen,
    fontFamily: fonts.regular,
    fontSize: fontSize.caption,
    color: colors.accent,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.lg,
    marginBottom: spacing.xs,
    marginHorizontal: spacing.screen,
  },
  field: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 48,
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
  count: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.screen + 2,
    fontFamily: fonts.heavy,
    fontSize: fontSize.body,
    color: colors.text,
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { flex: 1 },
  listContent: {
    gap: spacing.lg,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.screen,
    // The bottom padding, set in the JSX, keeps the last card clear of the dock.
  },
});
