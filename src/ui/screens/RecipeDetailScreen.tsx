// PRESENTATION LAYER: one recipe — times, servings, ingredients, steps, its source and similar recipes.
// The mockup's photo banner, status pill, per-ingredient pantry checks and Save button are left out:
// no data or service rule backs them yet.
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RecipeServices } from '../../createRecipeServices';
import { RecipeNotFoundError } from '../../domain/errors';
import type { RecipeSummary } from '../../domain/recipe';
import type { RecipeDetail } from '../../services/getRecipeDetail';
import { BackButton } from '../components/BackButton';
import { PrimaryButton } from '../components/PrimaryButton';
import { RecipeCard } from '../components/RecipeCard';
import { SourceCard } from '../components/SourceCard';
import { StateMessage } from '../components/StateMessage';
import { StepItem } from '../components/StepItem';
import { formatIngredientLine } from '../format/ingredientLine';
import {
  formatIngredientGroupHeading,
  formatServes,
  formatTimes,
  formatYield,
  groupIngredientsByComponent,
} from '../format/recipeInfo';
import { colors, fontSize, fontWeight, fonts, spacing } from '../theme';

type Props = {
  services: RecipeServices;
  /** Null when the URL doesn't hold a valid recipe id. */
  recipeId: number | null;
  onOpenRecipe: (recipeId: number) => void;
  onBack: () => void;
  onReturnToPantry: () => void;
  /** Opens the recipe's original page in the browser; tests pass a fake. */
  openLink?: (url: string) => Promise<unknown>;
};

type Load = { status: 'loading' } | { status: 'notFound' } | { status: 'failed' } | { status: 'done'; detail: RecipeDetail };

export function RecipeDetailScreen({
  services,
  recipeId,
  onOpenRecipe,
  onBack,
  onReturnToPantry,
  openLink = (url) => Linking.openURL(url),
}: Props) {
  const [load, setLoad] = useState<Load>(recipeId === null ? { status: 'notFound' } : { status: 'loading' });
  const [similar, setSimilar] = useState<RecipeSummary[]>([]);
  const [linkFailed, setLinkFailed] = useState(false);

  useEffect(() => {
    if (recipeId === null) return;
    // Replies for an earlier recipe id must not replace the recipe now on screen.
    let current = true;
    services.getRecipeDetail(recipeId).then(
      (detail) => {
        if (current) setLoad({ status: 'done', detail });
      },
      (error) => {
        if (current) setLoad({ status: error instanceof RecipeNotFoundError ? 'notFound' : 'failed' });
      },
    );
    // Similar recipes are extra: if they fail to load, the section just stays hidden.
    services.getSimilarRecipes(recipeId).then(
      (recipes) => {
        if (current) setSimilar(recipes);
      },
      () => {
        if (current) setSimilar([]);
      },
    );
    return () => {
      current = false;
    };
  }, [services, recipeId]);

  async function openSource(url: string) {
    setLinkFailed(false);
    try {
      await openLink(url);
    } catch {
      setLinkFailed(true);
    }
  }

  function renderRecipe({ recipe, ingredients }: RecipeDetail) {
    const yieldText = formatYield(recipe);
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{recipe.name}</Text>
        <View style={styles.meta}>
          <Text style={styles.metaText}>{formatTimes(recipe)}</Text>
          <Text style={styles.metaText}>{formatServes(recipe)}</Text>
          {yieldText ? <Text style={styles.metaText}>{yieldText}</Text> : null}
        </View>

        <Text style={styles.sectionTitle}>Ingredients</Text>
        {groupIngredientsByComponent(ingredients).map((group) => (
          <View key={group.component ?? ''}>
            {group.component ? (
              <Text style={styles.groupHeading}>{formatIngredientGroupHeading(group.component)}</Text>
            ) : null}
            {group.ingredients.map((ingredient, index) => (
              <Text
                key={ingredient.lineNumber}
                style={[styles.ingredient, index < group.ingredients.length - 1 && styles.ingredientDivider]}
              >
                {formatIngredientLine(ingredient)}
              </Text>
            ))}
          </View>
        ))}

        <Text style={[styles.sectionTitle, styles.stepsTitle]}>Steps</Text>
        {recipe.steps.map((step, index) => (
          <StepItem key={index} number={index + 1} text={step} />
        ))}

        <View style={styles.source}>
          <SourceCard recipe={recipe} onOpen={() => openSource(recipe.sourceUrl)} />
          {linkFailed ? <Text style={styles.linkError}>Couldn't open the original recipe.</Text> : null}
        </View>

        {similar.length > 0 ? (
          <View>
            <Text style={styles.sectionTitle}>Similar recipes</Text>
            <View style={styles.similarList}>
              {similar.map((other) => (
                <RecipeCard key={other.id} recipe={other} onPress={() => onOpenRecipe(other.id)} />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <BackButton label="Back to recipes" onPress={onBack} />
      </View>

      {load.status === 'loading' ? (
        <View style={styles.loading}>
          <ActivityIndicator accessibilityLabel="Loading recipe" color={colors.accent} />
        </View>
      ) : load.status === 'notFound' ? (
        <StateMessage message="Recipe not found." />
      ) : load.status === 'failed' ? (
        <StateMessage message="Couldn't load this recipe." />
      ) : (
        renderRecipe(load.detail)
      )}

      <View style={styles.footer}>
        <PrimaryButton label="Return to Pantry" onPress={onReturnToPantry} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: spacing.lg, paddingHorizontal: spacing.screen },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  content: { paddingTop: spacing.md, paddingHorizontal: spacing.screen, paddingBottom: spacing.xxxl },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSize.detailTitle,
    fontWeight: fontWeight.semibold,
    lineHeight: 30,
    color: colors.text,
  },
  meta: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 18, rowGap: spacing.xs, marginTop: spacing.lg },
  metaText: { fontSize: fontSize.meta, color: colors.textSecondary },
  sectionTitle: {
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
    fontFamily: fonts.heading,
    fontSize: fontSize.sectionTitle,
    fontWeight: fontWeight.semibold,
    color: colors.text,
  },
  stepsTitle: { marginBottom: 10 },
  groupHeading: {
    marginTop: spacing.md,
    fontSize: fontSize.meta,
    fontWeight: fontWeight.bold,
    color: colors.textSecondary,
  },
  ingredient: { paddingVertical: 9, fontSize: fontSize.body, color: colors.text },
  ingredientDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  source: { marginTop: spacing.sm },
  linkError: { marginTop: spacing.sm, marginHorizontal: spacing.xs, fontSize: fontSize.caption, color: colors.accent },
  similarList: { gap: spacing.lg },
  footer: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
