// PRESENTATION LAYER: one recipe — times, servings, ingredients, steps, its source and similar recipes.
// The mockup's banner is drawn as a tinted placeholder with an icon, since there are no photos. Its status
// pill, per-ingredient pantry checks and Save button are left out: no data or service rule backs them yet.
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RecipeServices } from '../../createRecipeServices';
import { RecipeNotFoundError } from '../../domain/errors';
import type { RecipeSummary } from '../../domain/recipe';
import type { RecipeDetail } from '../../services/getRecipeDetail';
import { BackButton } from '../components/BackButton';
import { Icon } from '../components/Icon';
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
import { colors, fonts, fontSize, spacing } from '../theme';

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

  /** The mockup's photo banner, with the back button on it. */
  const banner = (
    <View style={styles.banner}>
      <Icon name="utensils" size={64} color={colors.blue} strokeWidth={1.4} />
      <View style={styles.bannerBack}>
        <BackButton label="Back to recipes" onPress={onBack} overBanner />
      </View>
    </View>
  );

  function renderRecipe({ recipe, ingredients }: RecipeDetail) {
    const yieldText = formatYield(recipe);
    return (
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {banner}
        <View style={styles.content}>
          <Text style={styles.title}>{recipe.name}</Text>
          <View style={styles.meta}>
            <View style={styles.metaItem}>
              <Icon name="clock" size={15} color={colors.textSecondary} />
              <Text style={styles.metaText}>{formatTimes(recipe)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Icon name="people" size={15} color={colors.textSecondary} />
              <Text style={styles.metaText}>{formatServes(recipe)}</Text>
            </View>
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
          <View style={styles.steps}>
            {recipe.steps.map((step, index) => (
              <StepItem key={index} number={index + 1} text={step} />
            ))}
          </View>

          <View style={styles.source}>
            <Text style={[styles.sectionTitle, styles.sourceTitle]}>Source</Text>
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
        </View>
      </ScrollView>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Once the recipe is shown, the banner scrolls with it; until then it stays at the top. */}
      {load.status === 'done' ? null : banner}

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
  banner: { height: 200, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.blueSoft },
  bannerBack: { position: 'absolute', top: 18, left: 18 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxxl },
  content: { paddingTop: 18, paddingHorizontal: spacing.screen },
  title: {
    fontFamily: fonts.heading,
    fontSize: fontSize.detailTitle,
    lineHeight: 30,
    color: colors.text,
  },
  meta: { flexDirection: 'row', flexWrap: 'wrap', columnGap: 18, rowGap: spacing.xs, marginTop: spacing.lg },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontFamily: fonts.regular, fontSize: fontSize.meta, color: colors.textSecondary },
  sectionTitle: {
    marginTop: spacing.xxl,
    marginBottom: spacing.sm,
    fontFamily: fonts.heading,
    fontSize: fontSize.sectionTitle,
    color: colors.text,
  },
  stepsTitle: { marginTop: 22, marginBottom: 10 },
  steps: { gap: spacing.lg },
  groupHeading: {
    marginTop: spacing.md,
    fontSize: fontSize.meta,
    fontFamily: fonts.bold,
    color: colors.textSecondary,
  },
  // lineHeight 22 keeps the mockup's 40px rows, which it sizes around a 22px pantry-check chip.
  ingredient: { paddingVertical: 9, fontFamily: fonts.regular, fontSize: fontSize.body, lineHeight: 22, color: colors.text },
  ingredientDivider: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  // The mockup's steps section ends with 20px of padding, and its source section starts with 18px.
  source: { marginTop: spacing.xxl + 18 },
  sourceTitle: { marginTop: 0, marginBottom: 10 },
  linkError: { marginTop: spacing.sm, marginHorizontal: spacing.xs, fontFamily: fonts.regular, fontSize: fontSize.caption, color: colors.accent },
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
