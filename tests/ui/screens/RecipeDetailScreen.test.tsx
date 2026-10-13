import React from 'react';
import TestRenderer, { act, type ReactTestRenderer } from 'react-test-renderer';
import { ActivityIndicator } from 'react-native';
import type { RecipeServices } from '../../../src/createRecipeServices';
import { RecipeNotFoundError } from '../../../src/domain/errors';
import type { RecipeSummary } from '../../../src/domain/recipe';
import type { RecipeDetail } from '../../../src/services/getRecipeDetail';
import { BackButton } from '../../../src/ui/components/BackButton';
import { Icon } from '../../../src/ui/components/Icon';
import { RecipeCard } from '../../../src/ui/components/RecipeCard';
import { StepItem } from '../../../src/ui/components/StepItem';
import { RecipeDetailScreen } from '../../../src/ui/screens/RecipeDetailScreen';
import { makeIngredient, makeRecipe } from '../../fakes/InMemoryRecipeRepository';
import { shownText } from '../../support/render';

const sloppyJoes = makeRecipe({
  id: 7,
  name: 'Sloppy Joes',
  activeTimeMinutes: 15,
  totalTimeMinutes: 60,
  servingsMin: 3,
  servingsMax: 4,
  sourceSite: 'Budget Bytes',
  sourceUrl: 'https://www.budgetbytes.com/sloppy-joes/',
  steps: ['Brown the beef.', 'Stir in the sauce.'],
});
const garlic = makeIngredient({ lineNumber: 1, ingredient: 'garlic', quantityMin: 3, quantityMax: 3, unit: 'clove', preparation: 'minced' });
const soySauce = makeIngredient({ lineNumber: 2, component: 'stir fry sauce', ingredient: 'soy sauce', quantityMin: 2, quantityMax: 2, unit: 'tbsp' });
const detail: RecipeDetail = { recipe: sloppyJoes, ingredients: [garlic, soySauce] };

const otherSloppyJoes: RecipeSummary = {
  id: 8,
  name: "Sloppy Joe's",
  totalTimeMinutes: 30,
  activeTimeMinutes: 30,
  servingsMin: 4,
  servingsMax: 4,
};

/** By default recipe 7 loads with two ingredient lines, and it has no similar recipes. */
async function setup({
  recipeId = 7,
  getRecipeDetail = jest.fn().mockResolvedValue(detail),
  getSimilarRecipes = jest.fn().mockResolvedValue([]),
  openLink = jest.fn().mockResolvedValue(undefined),
}: {
  recipeId?: number | null;
  getRecipeDetail?: jest.Mock;
  getSimilarRecipes?: jest.Mock;
  openLink?: jest.Mock;
} = {}) {
  const services = { getRecipeDetail, getSimilarRecipes } as unknown as RecipeServices;
  const onOpenRecipe = jest.fn();
  const onBack = jest.fn();
  const onReturnToPantry = jest.fn();
  const screen = (id: number | null) => (
    <RecipeDetailScreen
      services={services}
      recipeId={id}
      onOpenRecipe={onOpenRecipe}
      onBack={onBack}
      onReturnToPantry={onReturnToPantry}
      openLink={openLink}
    />
  );
  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(screen(recipeId));
  });
  /** Re-renders the screen for a different recipe id. */
  const showRecipe = async (id: number) => act(async () => renderer.update(screen(id)));
  return { renderer, getRecipeDetail, getSimilarRecipes, openLink, onOpenRecipe, onBack, onReturnToPantry, showRecipe };
}

/** A promise the test resolves or rejects later, to control when a service reply arrives. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

const iconNames = (renderer: ReactTestRenderer) => renderer.root.findAllByType(Icon).map((icon) => icon.props.name);
const isLoading = (renderer: ReactTestRenderer) => renderer.root.findAllByType(ActivityIndicator).length > 0;
const startsWith = (renderer: ReactTestRenderer, prefix: string) =>
  shownText(renderer).some((text) => text.startsWith(prefix));

describe('RecipeDetailScreen', () => {
  describe('loading', () => {
    it('loads the recipe with its id', async () => {
      const { getRecipeDetail } = await setup({ recipeId: 7 });
      expect(getRecipeDetail).toHaveBeenCalledWith(7);
    });

    it('shows a loading indicator while the recipe loads', async () => {
      const { renderer } = await setup({ getRecipeDetail: jest.fn().mockReturnValue(deferred().promise) });
      expect(isLoading(renderer)).toBe(true);
    });

    it('hides the loading indicator once the recipe arrives', async () => {
      const { renderer } = await setup();
      expect(isLoading(renderer)).toBe(false);
    });

    it('ignores a recipe that arrives after the id changed', async () => {
      const forSeven = deferred<RecipeDetail>();
      const forEight = deferred<RecipeDetail>();
      const getRecipeDetail = jest.fn().mockReturnValueOnce(forSeven.promise).mockReturnValueOnce(forEight.promise);
      const { renderer, showRecipe } = await setup({ recipeId: 7, getRecipeDetail });
      await showRecipe(8);

      await act(async () => forEight.resolve({ recipe: makeRecipe({ ...otherSloppyJoes }), ingredients: [] }));
      await act(async () => forSeven.resolve(detail));

      expect(shownText(renderer)).not.toContain('Sloppy Joes');
    });
  });

  describe('recipe', () => {
    it('shows the recipe name', async () => {
      const { renderer } = await setup();
      expect(shownText(renderer)).toContain('Sloppy Joes');
    });

    it('shows the cooking times', async () => {
      const { renderer } = await setup();
      expect(shownText(renderer)).toContain('Hands-on 15 min · Ready in 1 hr');
    });

    it('shows the number of servings', async () => {
      const { renderer } = await setup();
      expect(shownText(renderer)).toContain('Serves 3–4');
    });

    it('shows what the recipe makes when the source gives a yield', async () => {
      const tacos = makeRecipe({ id: 7, yieldQuantity: 24, yieldUnit: 'piece' });
      const { renderer } = await setup({ getRecipeDetail: jest.fn().mockResolvedValue({ recipe: tacos, ingredients: [] }) });
      expect(shownText(renderer)).toContain('Makes 24 pieces');
    });

    it('leaves out the yield when the source gives none', async () => {
      const { renderer } = await setup();
      expect(startsWith(renderer, 'Makes ')).toBe(false);
    });

    it('shows each ingredient as a readable line', async () => {
      const { renderer } = await setup();
      expect(shownText(renderer)).toEqual(expect.arrayContaining(['3 cloves garlic, minced', '2 tbsp soy sauce']));
    });

    it("shows a heading above a sub-recipe's ingredients", async () => {
      const { renderer } = await setup();
      expect(shownText(renderer)).toContain('For the stir fry sauce');
    });

    it('shows no sub-heading when every ingredient is in the main recipe', async () => {
      const { renderer } = await setup({
        getRecipeDetail: jest.fn().mockResolvedValue({ recipe: sloppyJoes, ingredients: [garlic] }),
      });
      expect(startsWith(renderer, 'For the ')).toBe(false);
    });

    it('shows the steps in order, numbered from 1', async () => {
      const { renderer } = await setup();
      const steps = renderer.root.findAllByType(StepItem).map((step) => [step.props.number, step.props.text]);
      expect(steps).toEqual([[1, 'Brown the beef.'], [2, 'Stir in the sauce.']]);
    });

    it('draws a clock beside the times and people beside the servings', async () => {
      const { renderer } = await setup();
      expect(iconNames(renderer)).toEqual(expect.arrayContaining(['clock', 'people']));
    });

    it('shows a "Source" heading above where the recipe comes from', async () => {
      const { renderer } = await setup();
      expect(shownText(renderer)).toContain('Source');
    });

    it('shows where the recipe comes from', async () => {
      const { renderer } = await setup();
      expect(shownText(renderer)).toContain('Budget Bytes');
    });

    it('opens the original recipe when its link is pressed', async () => {
      const { renderer, openLink } = await setup();
      await act(async () => renderer.root.findByProps({ accessibilityRole: 'link' }).props.onPress());
      expect(openLink).toHaveBeenCalledWith('https://www.budgetbytes.com/sloppy-joes/');
    });

    it('says when the original recipe cannot be opened', async () => {
      const { renderer } = await setup({ openLink: jest.fn().mockRejectedValue(new Error('no browser')) });
      await act(async () => renderer.root.findByProps({ accessibilityRole: 'link' }).props.onPress());
      expect(shownText(renderer)).toContain("Couldn't open the original recipe.");
    });
  });

  describe('navigation', () => {
    it('goes back when the back button is pressed', async () => {
      const { renderer, onBack } = await setup();
      act(() => renderer.root.findByType(BackButton).props.onPress());
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('puts the back button on the recipe banner', async () => {
      const { renderer } = await setup();
      expect(renderer.root.findByType(BackButton).props.overBanner).toBe(true);
    });

    it('draws a utensils icon on the recipe banner', async () => {
      const { renderer } = await setup();
      expect(iconNames(renderer)).toContain('utensils');
    });

    it('still offers the back button while the recipe loads', async () => {
      const { renderer } = await setup({ getRecipeDetail: jest.fn().mockReturnValue(deferred().promise) });
      expect(renderer.root.findAllByType(BackButton)).toHaveLength(1);
    });

    it('labels the back button for screen readers', async () => {
      const { renderer } = await setup();
      expect(renderer.root.findByType(BackButton).props.label).toBe('Back to recipes');
    });

    it('returns to the pantry when Return to Pantry is pressed', async () => {
      const { renderer, onReturnToPantry } = await setup();
      act(() => renderer.root.findByProps({ accessibilityLabel: 'Return to Pantry' }).props.onPress());
      expect(onReturnToPantry).toHaveBeenCalledTimes(1);
    });
  });

  describe('similar recipes', () => {
    it('asks for recipes similar to this one', async () => {
      const { getSimilarRecipes } = await setup({ recipeId: 7 });
      expect(getSimilarRecipes).toHaveBeenCalledWith(7);
    });

    it('shows a "Similar recipes" heading when there are similar recipes', async () => {
      const { renderer } = await setup({ getSimilarRecipes: jest.fn().mockResolvedValue([otherSloppyJoes]) });
      expect(shownText(renderer)).toContain('Similar recipes');
    });

    it('shows a card for each similar recipe', async () => {
      const { renderer } = await setup({ getSimilarRecipes: jest.fn().mockResolvedValue([otherSloppyJoes]) });
      expect(renderer.root.findAllByType(RecipeCard).map((card) => card.props.recipe)).toEqual([otherSloppyJoes]);
    });

    it('opens a similar recipe when its card is pressed', async () => {
      const { renderer, onOpenRecipe } = await setup({ getSimilarRecipes: jest.fn().mockResolvedValue([otherSloppyJoes]) });
      act(() => renderer.root.findByType(RecipeCard).props.onPress());
      expect(onOpenRecipe).toHaveBeenCalledWith(8);
    });

    it('hides the section when there are no similar recipes', async () => {
      const { renderer } = await setup({ getSimilarRecipes: jest.fn().mockResolvedValue([]) });
      expect(shownText(renderer)).not.toContain('Similar recipes');
    });

    it('hides the section when similar recipes fail to load', async () => {
      const { renderer } = await setup({ getSimilarRecipes: jest.fn().mockRejectedValue(new Error('database busy')) });
      expect(shownText(renderer)).not.toContain('Similar recipes');
    });

    it('still shows the recipe when similar recipes fail to load', async () => {
      const { renderer } = await setup({ getSimilarRecipes: jest.fn().mockRejectedValue(new Error('database busy')) });
      expect(shownText(renderer)).toContain('Sloppy Joes');
    });
  });

  describe('problems', () => {
    it('shows "Recipe not found" when the recipe does not exist', async () => {
      const { renderer } = await setup({ getRecipeDetail: jest.fn().mockRejectedValue(new RecipeNotFoundError(7)) });
      expect(shownText(renderer)).toContain('Recipe not found.');
    });

    it('shows an error message when the recipe fails to load', async () => {
      const { renderer } = await setup({ getRecipeDetail: jest.fn().mockRejectedValue(new Error('database busy')) });
      expect(shownText(renderer)).toContain("Couldn't load this recipe.");
    });

    it('shows "Recipe not found" when there is no recipe id', async () => {
      const { renderer } = await setup({ recipeId: null });
      expect(shownText(renderer)).toContain('Recipe not found.');
    });

    it('does not ask for a recipe when there is no recipe id', async () => {
      const { getRecipeDetail, getSimilarRecipes } = await setup({ recipeId: null });
      expect([getRecipeDetail.mock.calls, getSimilarRecipes.mock.calls]).toEqual([[], []]);
    });

    it('still offers Return to Pantry when the recipe is not found', async () => {
      const { renderer, onReturnToPantry } = await setup({ recipeId: null });
      act(() => renderer.root.findByProps({ accessibilityLabel: 'Return to Pantry' }).props.onPress());
      expect(onReturnToPantry).toHaveBeenCalledTimes(1);
    });
  });
});
