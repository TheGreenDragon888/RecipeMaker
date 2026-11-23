// PRESENTATION LAYER: "Recipes for You" — pantry-ranked results. The Filters button opens the board's Filters sheet
// (hands-on time, number of people, Meal Prep), and closing it searches again with the choices. Each card shows how
// ready the recipe is to cook, chips narrow the results by that, and cards can be bookmarked from here.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RecipeServices } from '../../createRecipeServices';
import { activeFilterCount, type RecipeFilter } from '../../domain/recipeFilter';
import { countByReadinessFilter, matchesReadinessFilter, type ReadinessFilter } from '../../domain/recipeReadiness';
import type { PantryMatch } from '../../services/findRecipesFromPantry';
import { BackButton } from '../components/BackButton';
import { FiltersButton } from '../components/FiltersButton';
import { FiltersSheet } from '../components/FiltersSheet';
import { NoticeBar } from '../components/NoticeBar';
import { ReadinessFilterChips } from '../components/ReadinessFilterChips';
import { RecipeCard } from '../components/RecipeCard';
import { StateMessage } from '../components/StateMessage';
import { formatMatchedAgainst } from '../format/pantryInfo';
import { colors, fonts, fontSize, spacing } from '../theme';
import { useRecipeBookmarks } from '../useRecipeBookmarks';
import { useRecipeFilters } from '../useRecipeFilters';
import { useRecipeReadiness } from '../useRecipeReadiness';

const NO_MATCHES: PantryMatch[] = [];
const NO_FILTERS: RecipeFilter = {};

type Props = {
  services: RecipeServices;
  pantry: string[];
  onOpenRecipe: (recipeId: number) => void;
  /** Back to the Pantry screen (the header button and the no-match button). */
  onBack: () => void;
  /**
   * The safe area's bottom inset. The root layout gives this screen no bottom padding, so the Filters sheet can stand
   * on the screen's bottom edge; the screen leaves this much room under its list and notices itself.
   */
  bottomInset?: number;
  /** Changes when the screen comes back into view, so bookmarks and pantry changes made elsewhere show here. */
  refreshKey?: number;
};

type Search = { status: 'loading' } | { status: 'failed' } | { status: 'done'; matches: PantryMatch[] };

export function ResultsScreen({ services, pantry, onOpenRecipe, onBack, bottomInset = 0, refreshKey = 0 }: Props) {
  const { savedIds, toggle, saveFailed } = useRecipeBookmarks(services, refreshKey);
  const { readiness, state: readinessState, watch: watchReadiness } = useRecipeReadiness(services, refreshKey);
  const [readinessFilter, setReadinessFilter] = useState<ReadinessFilter>('all');
  const [search, setSearch] = useState<Search>({ status: 'loading' });

  // How many pantry results a set of choices in the Filters sheet would show (at most 20, as on screen).
  const countFor = useCallback(
    async (draft: RecipeFilter) => {
      const found = await (activeFilterCount(draft) > 0
        ? services.findRecipesFromPantry(pantry, draft)
        : services.findRecipesFromPantry(pantry));
      return found.length;
    },
    [pantry, services],
  );
  const filters = useRecipeFilters(countFor);
  const appliedFilters = filters.applied;
  const filtersActive = filters.activeCount > 0;

  useEffect(() => {
    // A reply for an earlier pantry list must not replace the results for the current one.
    let current = true;
    const request = appliedFilters
      ? services.findRecipesFromPantry(pantry, appliedFilters)
      : services.findRecipesFromPantry(pantry);
    setSearch({ status: 'loading' });
    request.then(
      (matches) => {
        if (current) setSearch({ status: 'done', matches });
      },
      () => {
        if (current) setSearch({ status: 'failed' });
      },
    );
    return () => {
      current = false;
    };
  }, [services, pantry, appliedFilters]);

  const matches = search.status === 'done' ? search.matches : NO_MATCHES;
  useEffect(() => watchReadiness(matches.map(({ recipe }) => recipe.id)), [matches, watchReadiness]);

  // Without a checked pantry there is nothing to filter by, which leaves every recipe showing.
  const checked = readinessState === 'done' ? readiness : null;
  const readinessCounts = useMemo(() => countByReadinessFilter(matches, checked), [matches, checked]);
  const visibleMatches = useMemo(
    () => matches.filter(({ recipe }) => matchesReadinessFilter(recipe.id, readinessFilter, checked)),
    [matches, readinessFilter, checked],
  );
  const showChips = checked !== null && matches.length > 0;

  return (
    <View style={styles.screen} testID="results-screen">
      <View style={styles.header}>
        <BackButton label="Back to pantry" onPress={onBack} />
        <Text style={styles.title}>Recipes for You</Text>
        {pantry.length > 0 ? <Text style={styles.subtitle}>{formatMatchedAgainst(pantry.length)}</Text> : null}
        <FiltersButton activeCount={filters.activeCount} onPress={filters.show} wrapperStyle={styles.filtersButton} />
      </View>

      {readinessState === 'failed' ? <Text style={styles.pantryProblem}>Couldn't check your pantry.</Text> : null}

      {showChips ? (
        <ReadinessFilterChips selected={readinessFilter} counts={readinessCounts} onSelect={setReadinessFilter} />
      ) : null}

      {search.status === 'loading' ? (
        <View style={styles.loading}>
          <ActivityIndicator accessibilityLabel="Finding recipes" color={colors.accent} />
        </View>
      ) : search.status === 'failed' ? (
        <StateMessage message="Couldn't load recipes." />
      ) : search.matches.length === 0 ? (
        <StateMessage
          message={filtersActive ? 'No recipes match your pantry and filters.' : 'No recipes match your pantry.'}
          action={{ label: 'Back to pantry', onPress: onBack }}
        />
      ) : visibleMatches.length === 0 ? (
        <StateMessage message="No recipes match this filter." />
      ) : (
        <ScrollView
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            showChips && styles.listContentBelowChips,
            { paddingBottom: spacing.sm + bottomInset },
          ]}
        >
          {visibleMatches.map((match) => (
            <RecipeCard
              key={match.recipe.id}
              recipe={match.recipe}
              readiness={readiness.get(match.recipe.id) ?? null}
              onHand={match}
              onPress={() => onOpenRecipe(match.recipe.id)}
              bookmark={{
                saved: savedIds ? savedIds.has(match.recipe.id) : null,
                onToggle: () => toggle(match.recipe.id),
              }}
            />
          ))}
        </ScrollView>
      )}
      {saveFailed ? <NoticeBar message="Couldn't update your bookmark." bottom={spacing.xl + bottomInset} /> : null}

      <FiltersSheet
        open={filters.open}
        bottomInset={bottomInset}
        value={appliedFilters ?? NO_FILTERS}
        count={filters.count}
        onChange={filters.onChange}
        onClose={filters.onClose}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: spacing.screenTop, paddingHorizontal: spacing.screen, paddingBottom: spacing.xxs },
  title: {
    marginTop: spacing.md,
    fontFamily: fonts.heading,
    fontSize: fontSize.screenTitle,
    color: colors.text,
  },
  subtitle: { marginTop: spacing.xs, fontFamily: fonts.regular, fontSize: fontSize.body, color: colors.textSecondary },
  filtersButton: { alignSelf: 'flex-start', marginTop: spacing.md },
  pantryProblem: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.screen,
    fontFamily: fonts.regular,
    fontSize: fontSize.caption,
    color: colors.accent,
  },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { flex: 1 },
  listContent: { gap: spacing.lg, paddingTop: spacing.lg, paddingHorizontal: spacing.screen },
  listContentBelowChips: { paddingTop: spacing.xxs },
});
