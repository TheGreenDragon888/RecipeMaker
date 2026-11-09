// PRESENTATION LAYER: "Recipes for You" — pantry-ranked results with serving-range and Meal Prep filters.
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import type { RecipeServices } from '../../createRecipeServices';
import type { PantryMatch, PantryRecipeFilters } from '../../services/findRecipesFromPantry';
import { BackButton } from '../components/BackButton';
import { PressableScale } from '../components/PressableScale';
import { RecipeCard } from '../components/RecipeCard';
import { StateMessage } from '../components/StateMessage';
import { formatMatchedAgainst } from '../format/pantryInfo';
import { colors, fonts, fontSize, radii, spacing } from '../theme';

type Props = {
  services: RecipeServices;
  pantry: string[];
  onOpenRecipe: (recipeId: number) => void;
  /** Back to the Pantry screen (the header button and the no-match button). */
  onBack: () => void;
};

type Search = { status: 'loading' } | { status: 'failed' } | { status: 'done'; matches: PantryMatch[] };

export function ResultsScreen({ services, pantry, onOpenRecipe, onBack }: Props) {
  const [search, setSearch] = useState<Search>({ status: 'loading' });
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [minimumServings, setMinimumServings] = useState('');
  const [maximumServings, setMaximumServings] = useState('');
  const [maximumActiveMinutes, setMaximumActiveMinutes] = useState('');
  const [mealPrepOnly, setMealPrepOnly] = useState(false);
  const [appliedFilters, setAppliedFilters] = useState<PantryRecipeFilters>();
  const [filterError, setFilterError] = useState<string | null>(null);

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

    const filters: PantryRecipeFilters = {};
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

  return (
    <TouchableWithoutFeedback accessible={false} onPress={() => Keyboard.dismiss()}>
      <View style={styles.screen} testID="results-screen">
      <View style={styles.header}>
        <BackButton label="Back to pantry" onPress={onBack} />
        <Text style={styles.title}>Recipes for You</Text>
        {pantry.length > 0 ? <Text style={styles.subtitle}>{formatMatchedAgainst(pantry.length)}</Text> : null}
        <PressableScale
          size="small"
          accessibilityRole="button"
          accessibilityLabel="Filters"
          accessibilityState={{ expanded: filtersOpen }}
          onPress={() => {
            Keyboard.dismiss();
            setFiltersOpen((open) => !open);
          }}
          style={({ pressed }) => [styles.filterToggle, pressed && styles.controlPressed]}
        >
          <Text style={styles.filterToggleText}>{filtersActive ? 'Filters · Active' : 'Filters'}</Text>
        </PressableScale>
      </View>

      {filtersOpen ? (
        <View style={styles.filterPanel}>
          <Text style={styles.filterHeading}>Serving range</Text>
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
          <Text style={styles.filterHint}>Include recipes whose serving range overlaps yours.</Text>
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
      ) : (
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {search.matches.map((match) => (
            <RecipeCard
              key={match.recipe.id}
              recipe={match.recipe}
              onHand={match}
              onPress={() => onOpenRecipe(match.recipe.id)}
            />
          ))}
        </ScrollView>
      )}
      </View>
    </TouchableWithoutFeedback>
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
  filterHint: { fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.textSecondary },
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
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { flex: 1 },
  listContent: { gap: spacing.lg, paddingTop: spacing.lg, paddingHorizontal: spacing.screen, paddingBottom: spacing.sm },
});
