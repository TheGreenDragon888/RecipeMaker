import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { RecipeServices } from '../../../src/createRecipeServices';
import { RecipeNotFoundError } from '../../../src/domain/errors';
import type { RecipeSummary } from '../../../src/domain/recipe';
import type { RecipeDetail } from '../../../src/services/getRecipeDetail';
import { RecipeDetailScreen } from '../../../src/ui/screens/RecipeDetailScreen';
import { makeIngredient, makeRecipe } from '../../fakes/InMemoryRecipeRepository';
import { colors } from '../../../src/ui/theme';
import { isLoading, recipeCardNames, recipeCards, shownIcons, shownText, styleOf } from '../../support/screen';

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
  const detailFor = (id: number | null) => (
    <RecipeDetailScreen
      services={services}
      recipeId={id}
      onOpenRecipe={onOpenRecipe}
      onBack={onBack}
      onReturnToPantry={onReturnToPantry}
      openLink={openLink}
    />
  );
  await render(detailFor(recipeId));
  /** Re-renders the screen for a different recipe id. */
  const showRecipe = (id: number) => screen.rerender(detailFor(id));
  return { getRecipeDetail, getSimilarRecipes, openLink, onOpenRecipe, onBack, onReturnToPantry, showRecipe };
}

/** A promise the test resolves or rejects later, to control when a service reply arrives. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

const startsWith = (prefix: string) => shownText().some((text) => text.startsWith(prefix));
const backButton = () => screen.getByRole('button', { name: 'Back to recipes' });
const returnToPantry = () => screen.getByRole('button', { name: 'Return to Pantry' });

describe('RecipeDetailScreen', () => {
  describe('loading', () => {
    it('loads the recipe with its id', async () => {
      const { getRecipeDetail } = await setup({ recipeId: 7 });
      expect(getRecipeDetail).toHaveBeenCalledWith(7);
    });

    it('shows a loading indicator while the recipe loads', async () => {
      await setup({ getRecipeDetail: jest.fn().mockReturnValue(deferred().promise) });
      expect(isLoading()).toBe(true);
    });

    it('hides the loading indicator once the recipe arrives', async () => {
      await setup();
      expect(isLoading()).toBe(false);
    });

    it('ignores a recipe that arrives after the id changed', async () => {
      const forSeven = deferred<RecipeDetail>();
      const forEight = deferred<RecipeDetail>();
      const getRecipeDetail = jest.fn().mockReturnValueOnce(forSeven.promise).mockReturnValueOnce(forEight.promise);
      const { showRecipe } = await setup({ recipeId: 7, getRecipeDetail });
      await showRecipe(8);

      await act(async () => forEight.resolve({ recipe: makeRecipe({ ...otherSloppyJoes }), ingredients: [] }));
      await act(async () => forSeven.resolve(detail));

      expect(shownText()).not.toContain('Sloppy Joes');
    });
  });

  describe('recipe', () => {
    it('shows the recipe name', async () => {
      await setup();
      expect(shownText()).toContain('Sloppy Joes');
    });

    it('shows the cooking times', async () => {
      await setup();
      expect(shownText()).toContain('Hands-on 15 min · Ready in 1 hr');
    });

    it('shows the number of servings', async () => {
      await setup();
      expect(shownText()).toContain('Serves 3–4');
    });

    it('shows what the recipe makes when the source gives a yield', async () => {
      const tacos = makeRecipe({ id: 7, yieldQuantity: 24, yieldUnit: 'piece' });
      await setup({ getRecipeDetail: jest.fn().mockResolvedValue({ recipe: tacos, ingredients: [] }) });
      expect(shownText()).toContain('Makes 24 pieces');
    });

    it('leaves out the yield when the source gives none', async () => {
      await setup();
      expect(startsWith('Makes ')).toBe(false);
    });

    it('shows each ingredient as a readable line', async () => {
      await setup();
      expect(shownText()).toEqual(expect.arrayContaining(['3 cloves garlic, minced', '2 tbsp soy sauce']));
    });

    it("shows a heading above a sub-recipe's ingredients", async () => {
      await setup();
      expect(shownText()).toContain('For the stir fry sauce');
    });

    it('shows no sub-heading when every ingredient is in the main recipe', async () => {
      await setup({
        getRecipeDetail: jest.fn().mockResolvedValue({ recipe: sloppyJoes, ingredients: [garlic] }),
      });
      expect(startsWith('For the ')).toBe(false);
    });

    it('shows the steps in order, numbered from 1', async () => {
      await setup();
      // Each step shows its number, then its text.
      const text = shownText();
      const steps = ['Brown the beef.', 'Stir in the sauce.'].map((step) => [text[text.indexOf(step) - 1], step]);
      expect(steps).toEqual([['1', 'Brown the beef.'], ['2', 'Stir in the sauce.']]);
      expect(text.indexOf('Brown the beef.')).toBeLessThan(text.indexOf('Stir in the sauce.'));
    });

    it('draws a clock beside the times and people beside the servings', async () => {
      await setup();
      expect(shownIcons()).toEqual(expect.arrayContaining(['clock', 'people']));
    });

    it('shows a "Source" heading above where the recipe comes from', async () => {
      await setup();
      expect(shownText()).toContain('Source');
    });

    it('shows where the recipe comes from', async () => {
      await setup();
      expect(shownText()).toContain('Budget Bytes');
    });

    it('opens the original recipe when its link is pressed', async () => {
      const { openLink } = await setup();
      await fireEvent.press(screen.getByRole('link'));
      expect(openLink).toHaveBeenCalledWith('https://www.budgetbytes.com/sloppy-joes/');
    });

    it('says when the original recipe cannot be opened', async () => {
      await setup({ openLink: jest.fn().mockRejectedValue(new Error('no browser')) });
      await fireEvent.press(screen.getByRole('link'));
      expect(shownText()).toContain("Couldn't open the original recipe.");
    });
  });

  describe('navigation', () => {
    it('goes back when the back button is pressed', async () => {
      const { onBack } = await setup();
      await fireEvent.press(backButton());
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('puts the back button on the recipe banner', async () => {
      await setup();
      // Over the banner, the back button has the see-through fill (see BackButton's tests).
      expect(styleOf(backButton()).backgroundColor).toBe(colors.surfaceTranslucent);
    });

    it('draws a utensils icon on the recipe banner', async () => {
      await setup();
      expect(shownIcons()).toContain('utensils');
    });

    it('still offers the back button while the recipe loads', async () => {
      await setup({ getRecipeDetail: jest.fn().mockReturnValue(deferred().promise) });
      expect(screen.getAllByRole('button', { name: 'Back to recipes' })).toHaveLength(1);
    });

    it('labels the back button for screen readers', async () => {
      await setup();
      expect(backButton()).toHaveAccessibleName('Back to recipes');
    });

    it('returns to the pantry when Return to Pantry is pressed', async () => {
      const { onReturnToPantry } = await setup();
      await fireEvent.press(returnToPantry());
      expect(onReturnToPantry).toHaveBeenCalledTimes(1);
    });
  });

  describe('similar recipes', () => {
    it('asks for recipes similar to this one', async () => {
      const { getSimilarRecipes } = await setup({ recipeId: 7 });
      expect(getSimilarRecipes).toHaveBeenCalledWith(7);
    });

    it('shows a "Similar recipes" heading when there are similar recipes', async () => {
      await setup({ getSimilarRecipes: jest.fn().mockResolvedValue([otherSloppyJoes]) });
      expect(shownText()).toContain('Similar recipes');
    });

    it('shows a card for each similar recipe', async () => {
      await setup({ getSimilarRecipes: jest.fn().mockResolvedValue([otherSloppyJoes]) });
      expect(recipeCardNames()).toEqual([otherSloppyJoes.name]);
    });

    it('opens a similar recipe when its card is pressed', async () => {
      const { onOpenRecipe } = await setup({ getSimilarRecipes: jest.fn().mockResolvedValue([otherSloppyJoes]) });
      await fireEvent.press(recipeCards()[0]);
      expect(onOpenRecipe).toHaveBeenCalledWith(8);
    });

    it('hides the section when there are no similar recipes', async () => {
      await setup({ getSimilarRecipes: jest.fn().mockResolvedValue([]) });
      expect(shownText()).not.toContain('Similar recipes');
    });

    it('hides the section when similar recipes fail to load', async () => {
      await setup({ getSimilarRecipes: jest.fn().mockRejectedValue(new Error('database busy')) });
      expect(shownText()).not.toContain('Similar recipes');
    });

    it('still shows the recipe when similar recipes fail to load', async () => {
      await setup({ getSimilarRecipes: jest.fn().mockRejectedValue(new Error('database busy')) });
      expect(shownText()).toContain('Sloppy Joes');
    });
  });

  describe('problems', () => {
    it('shows "Recipe not found" when the recipe does not exist', async () => {
      await setup({ getRecipeDetail: jest.fn().mockRejectedValue(new RecipeNotFoundError(7)) });
      expect(shownText()).toContain('Recipe not found.');
    });

    it('shows an error message when the recipe fails to load', async () => {
      await setup({ getRecipeDetail: jest.fn().mockRejectedValue(new Error('database busy')) });
      expect(shownText()).toContain("Couldn't load this recipe.");
    });

    it('shows "Recipe not found" when there is no recipe id', async () => {
      await setup({ recipeId: null });
      expect(shownText()).toContain('Recipe not found.');
    });

    it('does not ask for a recipe when there is no recipe id', async () => {
      const { getRecipeDetail, getSimilarRecipes } = await setup({ recipeId: null });
      expect([getRecipeDetail.mock.calls, getSimilarRecipes.mock.calls]).toEqual([[], []]);
    });

    it('still offers Return to Pantry when the recipe is not found', async () => {
      const { onReturnToPantry } = await setup({ recipeId: null });
      await fireEvent.press(returnToPantry());
      expect(onReturnToPantry).toHaveBeenCalledTimes(1);
    });
  });
});
