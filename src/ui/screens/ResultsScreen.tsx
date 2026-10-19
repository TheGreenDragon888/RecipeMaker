// PRESENTATION LAYER: "Recipes for You" — the recipes findRecipesFromPantry ranks for the pantry list,
// in the service's order. The mockup's filter chips are left out: no service rule backs them yet.
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RecipeServices } from '../../createRecipeServices';
import type { PantryMatch } from '../../services/findRecipesFromPantry';
import { BackButton } from '../components/BackButton';
import { RecipeCard } from '../components/RecipeCard';
import { StateMessage } from '../components/StateMessage';
import { formatMatchedAgainst } from '../format/pantryInfo';
import { colors, fonts, fontSize, spacing } from '../theme';

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

  useEffect(() => {
    // A reply for an earlier pantry list must not replace the results for the current one.
    let current = true;
    services.findRecipesFromPantry(pantry).then(
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
  }, [services, pantry]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <BackButton label="Back to pantry" onPress={onBack} />
        <Text style={styles.title}>Recipes for You</Text>
        {pantry.length > 0 ? <Text style={styles.subtitle}>{formatMatchedAgainst(pantry.length)}</Text> : null}
      </View>

      {search.status === 'loading' ? (
        <View style={styles.loading}>
          <ActivityIndicator accessibilityLabel="Finding recipes" color={colors.accent} />
        </View>
      ) : search.status === 'failed' ? (
        <StateMessage message="Couldn't load recipes." />
      ) : search.matches.length === 0 ? (
        <StateMessage message="No recipes match your pantry." action={{ label: 'Back to pantry', onPress: onBack }} />
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
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { flex: 1 },
  listContent: { gap: spacing.lg, paddingTop: spacing.lg, paddingHorizontal: spacing.screen, paddingBottom: spacing.sm },
});
