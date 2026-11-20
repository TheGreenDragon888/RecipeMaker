// PRESENTATION LAYER: browse, search, and filter all recipes, without a pantry.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ListRenderItem,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import type { RecipeServices } from '../../createRecipeServices';
import type { RecipeSummary } from '../../domain/recipe';
import type { RecipeFilter } from '../../services/filterRecipes';
import { ClearFieldButton } from '../components/ClearFieldButton';
import { Icon } from '../components/Icon';
import { PressableScale } from '../components/PressableScale';
import { RecipeCard } from '../components/RecipeCard';
import { StateMessage } from '../components/StateMessage';
import { colors, dock, fonts, fontSize, radii, spacing } from '../theme';

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
};

type Load = { status: 'loading' } | { status: 'failed' } | { status: 'done'; recipes: RecipeSummary[] };
type SearchLoad =
  | { status: 'idle' | 'loading' | 'failed' }
  | { status: 'done'; recipes: RecipeSummary[] };
type FilterLoad =
  | { status: 'idle' | 'loading' | 'failed' }
  | { status: 'done'; recipes: RecipeSummary[] };

export function RecipesScreen({ services, onOpenRecipe, bottomClearance = dock.clearance }: Props) {
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [searchText, setSearchText] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchLoad, setSearchLoad] = useState<SearchLoad>({ status: 'idle' });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [minimumServings, setMinimumServings] = useState('');
  const [maximumServings, setMaximumServings] = useState('');
  const [maximumActiveMinutes, setMaximumActiveMinutes] = useState('');
  const [mealPrepOnly, setMealPrepOnly] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<RecipeFilter>();
  const [filterError, setFilterError] = useState<string | null>(null);
  const [filterLoad, setFilterLoad] = useState<FilterLoad>({ status: 'idle' });

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

  const applyFilters = () => {
    Keyboard.dismiss();
    const min = minimumServings.trim() ? Number(minimumServings) : undefined;
    const max = maximumServings.trim() ? Number(maximumServings) : undefined;
    const activeMinutes = maximumActiveMinutes.trim() ? Number(maximumActiveMinutes) : undefined;
    if (
      (min !== undefined && (!Number.isInteger(min) || min < 1)) ||
      (max !== undefined && (!Number.isInteger(max) || max < 1)) ||
      (activeMinutes !== undefined && (!Number.isInteger(activeMinutes) || activeMinutes < 1))
    ) {
      setFilterError('Serving counts and active time must be positive whole numbers.');
      return;
    }
    if ((min === undefined) !== (max === undefined)) {
      setFilterError('Enter both the minimum and maximum servings.');
      return;
    }
    if (min !== undefined && max !== undefined && max < min) {
      setFilterError('Maximum servings must be at least the minimum.');
      return;
    }

    const filters: RecipeFilter = {};
    if (min !== undefined && max !== undefined) filters.servingRange = { min, max };
    if (activeMinutes !== undefined) filters.maxActiveMinutes = activeMinutes;
    if (mealPrepOnly) filters.mealPrepOnly = true;
    setFilterError(null);
    setAppliedFilters(Object.keys(filters).length > 0 ? filters : undefined);
  };

  const clearFilters = () => {
    Keyboard.dismiss();
    setMinimumServings('');
    setMaximumServings('');
    setMaximumActiveMinutes('');
    setMealPrepOnly(false);
    setFilterError(null);
    setAppliedFilters(undefined);
  };
  const filtersActive = Boolean(
    appliedFilters?.servingRange || appliedFilters?.maxActiveMinutes || appliedFilters?.mealPrepOnly,
  );

  // The list redraws every card when these change, so they stay the same objects across the screen's redraws
  // (the tab redraws this screen each time it opens).
  const renderItem = useCallback<ListRenderItem<RecipeSummary>>(
    ({ item }) => <RecipeCard recipe={item} onPress={() => onOpenRecipe(item.id)} />,
    [onOpenRecipe],
  );
  const listContentStyle = useMemo(() => [styles.listContent, { paddingBottom: bottomClearance }], [bottomClearance]);
  const handleListScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (filtersOpen && event.nativeEvent.contentOffset.y > 8) setFiltersOpen(false);
    },
    [filtersOpen],
  );

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
    <TouchableWithoutFeedback
      accessible={false}
      onPress={() => {
        Keyboard.dismiss();
        setFiltersOpen(false);
      }}
    >
      <View style={styles.screen} testID="recipes-screen">
        <View style={styles.header}>
          <Text style={styles.title}>All Recipes</Text>
          <PressableScale
            size="small"
            accessibilityRole="button"
            accessibilityLabel="Filters"
            accessibilityState={{ expanded: filtersOpen }}
            onPress={() => {
              Keyboard.dismiss();
              setFiltersOpen((open) => !open);
            }}
            style={({ pressed }) => [styles.filterToggle, filtersActive && styles.filterToggleActive, pressed && styles.controlPressed]}
          >
            <Text style={styles.filterToggleText}>{filtersActive ? 'Filters · Active' : 'Filters'}</Text>
          </PressableScale>
        </View>

        {filtersOpen ? (
          <View style={styles.filterPanel}>
            <Text style={styles.filterHeading}>People Recipe Serves</Text>
            <View style={styles.servingFields}>
              <TextInput
                accessibilityLabel="Minimum servings"
                keyboardType="number-pad"
                onChangeText={setMinimumServings}
                placeholder="Min"
                placeholderTextColor={colors.textMuted}
                style={styles.servingInput}
                value={minimumServings}
              />
              <Text style={styles.rangeSeparator}>to</Text>
              <TextInput
                accessibilityLabel="Maximum servings"
                keyboardType="number-pad"
                onChangeText={setMaximumServings}
                placeholder="Max"
                placeholderTextColor={colors.textMuted}
                style={styles.servingInput}
                value={maximumServings}
              />
            </View>
            <Text style={styles.filterHeading}>Maximum active time (minutes)</Text>
            <TextInput
              accessibilityLabel="Maximum active time in minutes"
              keyboardType="number-pad"
              onChangeText={setMaximumActiveMinutes}
              placeholder="No limit"
              placeholderTextColor={colors.textMuted}
              style={styles.servingInput}
              value={maximumActiveMinutes}
            />
            <PressableScale
              size="small"
              accessibilityRole="button"
              accessibilityLabel="Meal Prep only"
              accessibilityState={{ selected: mealPrepOnly }}
              onPress={() => setMealPrepOnly((selected) => !selected)}
              style={({ pressed }) => [
                styles.mealPrepToggle,
                mealPrepOnly && styles.mealPrepSelected,
                pressed && styles.controlPressed,
              ]}
            >
              <Text style={[styles.mealPrepText, mealPrepOnly && styles.mealPrepSelectedText]}>Meal Prep only</Text>
            </PressableScale>
            <Text style={styles.filterDescription}>Recipes that serve 4+ and keep well when made ahead.</Text>
            {filterError ? <Text accessibilityRole="alert" style={styles.filterError}>{filterError}</Text> : null}
            <View style={styles.filterActions}>
              <PressableScale
                size="small"
                accessibilityRole="button"
                accessibilityLabel="Apply filters"
                onPress={applyFilters}
                style={({ pressed }) => [styles.applyButton, pressed && styles.controlPressed]}
              >
                <Text style={styles.applyText}>Apply filters</Text>
              </PressableScale>
              <PressableScale
                size="small"
                accessibilityRole="button"
                accessibilityLabel="Clear filters"
                onPress={clearFilters}
                style={({ pressed }) => [styles.clearButton, pressed && styles.controlPressed]}
              >
                <Text style={styles.clearText}>Clear</Text>
              </PressableScale>
            </View>
          </View>
        ) : null}

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
          <StateMessage message={filtersActive ? 'No recipes match your filters.' : searching ? 'No recipes found.' : 'No recipes yet.'} />
        ) : (
          <FlatList
            style={styles.list}
            contentContainerStyle={listContentStyle}
            data={visibleRecipes}
            {...LIST_WINDOW}
            keyExtractor={recipeKey}
            onScroll={handleListScroll}
            renderItem={renderItem}
          />
        )}
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: spacing.screenTop, paddingHorizontal: spacing.screen, paddingBottom: spacing.xxs },
  title: { fontFamily: fonts.heading, fontSize: fontSize.screenTitle, color: colors.text },
  filterToggle: {
    alignSelf: 'flex-start',
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    backgroundColor: colors.surface,
  },
  filterToggleText: { fontFamily: fonts.semibold, fontSize: fontSize.body, color: colors.text },
  filterToggleActive: { borderColor: colors.accent, backgroundColor: colors.accentTint },
  filterPanel: {
    marginHorizontal: spacing.screen,
    marginBottom: spacing.sm,
    padding: spacing.lg,
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  filterHeading: { fontFamily: fonts.semibold, fontSize: fontSize.body, color: colors.text },
  servingFields: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  servingInput: {
    flex: 1,
    minHeight: 42,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.background,
    fontFamily: fonts.regular,
    fontSize: fontSize.input,
    color: colors.text,
    textAlign: 'center',
  },
  rangeSeparator: { fontFamily: fonts.regular, fontSize: fontSize.body, color: colors.textSecondary },
  filterDescription: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary },
  mealPrepToggle: {
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.pill,
    backgroundColor: colors.background,
  },
  mealPrepSelected: { borderColor: colors.accent, backgroundColor: colors.accentTint },
  mealPrepText: { fontFamily: fonts.semibold, fontSize: fontSize.body, color: colors.text },
  mealPrepSelectedText: { color: colors.accent },
  filterError: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.accent },
  filterActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.xs },
  applyButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg, borderRadius: radii.md, backgroundColor: colors.accent },
  applyText: { fontFamily: fonts.bold, fontSize: fontSize.body, color: colors.onAccent },
  clearButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.lg },
  clearText: { fontFamily: fonts.semibold, fontSize: fontSize.body, color: colors.textSecondary },
  controlPressed: { opacity: 0.8 },
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
