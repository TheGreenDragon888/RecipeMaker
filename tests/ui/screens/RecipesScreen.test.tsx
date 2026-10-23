import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import type { RecipeServices } from '../../../src/createRecipeServices';
import type { RecipeSummary } from '../../../src/domain/recipe';
import { RecipesScreen } from '../../../src/ui/screens/RecipesScreen';
import { dock } from '../../../src/ui/theme';
import { isLoading, listContentStyle, recipeCardNames, recipeCards, shownText } from '../../support/screen';

function makeSummary(id: number, name: string): RecipeSummary {
  return { id, name, totalTimeMinutes: 30, activeTimeMinutes: 15, servingsMin: 4, servingsMax: 4 };
}

/** By default the service returns no recipes. */
async function setup({
  listAllRecipes = jest.fn().mockResolvedValue([]),
  bottomClearance,
}: { listAllRecipes?: jest.Mock; bottomClearance?: number } = {}) {
  const services = { listAllRecipes } as unknown as RecipeServices;
  const onOpenRecipe = jest.fn();
  await render(<RecipesScreen services={services} onOpenRecipe={onOpenRecipe} bottomClearance={bottomClearance} />);
  return { listAllRecipes, onOpenRecipe };
}

const never = () => new Promise<never>(() => {});

describe('RecipesScreen', () => {
  describe('loading', () => {
    it('asks for every recipe', async () => {
      const { listAllRecipes } = await setup();
      expect(listAllRecipes).toHaveBeenCalledTimes(1);
    });

    it('shows a loading indicator while recipes load', async () => {
      await setup({ listAllRecipes: jest.fn().mockReturnValue(never()) });
      expect(isLoading()).toBe(true);
    });

    it('hides the loading indicator once recipes arrive', async () => {
      await setup({ listAllRecipes: jest.fn().mockResolvedValue([makeSummary(1, 'Chili')]) });
      expect(isLoading()).toBe(false);
    });
  });

  describe('the list', () => {
    it('has the title "Recipes"', async () => {
      await setup();
      expect(shownText()).toContain('Recipes');
    });

    it('lists the recipes in the order the service returns them', async () => {
      await setup({
        listAllRecipes: jest.fn().mockResolvedValue([makeSummary(2, 'Apple Pie'), makeSummary(1, 'Chili')]),
      });
      expect(recipeCardNames()).toEqual(['Apple Pie', 'Chili']);
    });

    it('shows no pantry match on the cards', async () => {
      await setup({ listAllRecipes: jest.fn().mockResolvedValue([makeSummary(1, 'Chili')]) });
      expect(shownText().some((text) => text.endsWith('on hand'))).toBe(false);
    });

    it('opens a recipe when its card is pressed', async () => {
      const { onOpenRecipe } = await setup({
        listAllRecipes: jest.fn().mockResolvedValue([makeSummary(1, 'Apple Pie'), makeSummary(2, 'Chili')]),
      });
      await fireEvent.press(recipeCards()[1]);
      expect(onOpenRecipe).toHaveBeenCalledWith(2);
    });

    it('leaves room below the last card so the dock does not cover it', async () => {
      await setup({ listAllRecipes: jest.fn().mockResolvedValue([makeSummary(1, 'Chili')]) });
      expect(listContentStyle().paddingBottom).toBeGreaterThanOrEqual(dock.clearance);
    });

    it('leaves room for a dock lifted by a home indicator', async () => {
      await setup({ listAllRecipes: jest.fn().mockResolvedValue([makeSummary(1, 'Chili')]), bottomClearance: 110 });
      expect(listContentStyle().paddingBottom).toBeGreaterThanOrEqual(110);
    });
  });

  describe('nothing to show', () => {
    it('shows a message when there are no recipes', async () => {
      await setup({ listAllRecipes: jest.fn().mockResolvedValue([]) });
      expect(shownText()).toContain('No recipes yet.');
    });

    it('shows an error message when loading fails', async () => {
      await setup({ listAllRecipes: jest.fn().mockRejectedValue(new Error('database busy')) });
      expect(shownText()).toContain("Couldn't load recipes.");
    });

    it('does not show the no-recipes message when loading fails', async () => {
      await setup({ listAllRecipes: jest.fn().mockRejectedValue(new Error('database busy')) });
      expect(shownText()).not.toContain('No recipes yet.');
    });
  });
});
