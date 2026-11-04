import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
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
  searchRecipes = jest.fn().mockResolvedValue([]),
  bottomClearance,
}: { listAllRecipes?: jest.Mock; searchRecipes?: jest.Mock; bottomClearance?: number } = {}) {
  const services = { listAllRecipes, searchRecipes } as unknown as RecipeServices;
  const onOpenRecipe = jest.fn();
  await render(<RecipesScreen services={services} onOpenRecipe={onOpenRecipe} bottomClearance={bottomClearance} />);
  return { listAllRecipes, searchRecipes, onOpenRecipe };
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

    describe('search', () => {
      afterEach(() => jest.useRealTimers());

      it('shows a search field matching the pantry field prompt', async () => {
        await setup();
        expect(screen.getByLabelText('Search recipes')).toBeTruthy();
        expect(screen.getByPlaceholderText('Search recipes…')).toBeTruthy();
      });

      it('searches after typing and displays the matching recipes', async () => {
        const { searchRecipes } = await setup({
          listAllRecipes: jest.fn().mockResolvedValue([makeSummary(1, 'Apple Pie')]),
          searchRecipes: jest.fn().mockResolvedValue([makeSummary(2, 'Potato Soup')]),
        });

        jest.useFakeTimers();
        await fireEvent.changeText(screen.getByLabelText('Search recipes'), 'potato');
        expect(searchRecipes).not.toHaveBeenCalled();
        await act(async () => {
          jest.advanceTimersByTime(250);
        });

        expect(searchRecipes).toHaveBeenCalledWith('potato');
        expect(recipeCardNames()).toEqual(['Potato Soup']);
      });

      it('restores the full list when the search is cleared', async () => {
        const { searchRecipes } = await setup({
          listAllRecipes: jest.fn().mockResolvedValue([makeSummary(1, 'Apple Pie'), makeSummary(2, 'Potato Soup')]),
          searchRecipes: jest.fn().mockResolvedValue([makeSummary(2, 'Potato Soup')]),
        });

        jest.useFakeTimers();
        await fireEvent.changeText(screen.getByLabelText('Search recipes'), 'potato');
        await act(async () => {
          jest.advanceTimersByTime(250);
        });
        expect(recipeCardNames()).toEqual(['Potato Soup']);

        await fireEvent.changeText(screen.getByLabelText('Search recipes'), '');
        expect(searchRecipes).toHaveBeenCalledTimes(1);
        expect(recipeCardNames()).toEqual(['Apple Pie', 'Potato Soup']);
      });

      it('shows a search-specific empty state when there are no matches', async () => {
        await setup({ listAllRecipes: jest.fn().mockResolvedValue([makeSummary(1, 'Apple Pie')]) });
        jest.useFakeTimers();
        await fireEvent.changeText(screen.getByLabelText('Search recipes'), 'missing');
        await act(async () => {
          jest.advanceTimersByTime(250);
        });

        expect(shownText()).toContain('No recipes found.');
        expect(shownText()).not.toContain('No recipes yet.');
      });

      it('shows an error when searching fails', async () => {
        await setup({ searchRecipes: jest.fn().mockRejectedValue(new Error('database busy')) });
        jest.useFakeTimers();
        await fireEvent.changeText(screen.getByLabelText('Search recipes'), 'potato');
        await act(async () => {
          jest.advanceTimersByTime(250);
        });

        expect(shownText()).toContain("Couldn't search recipes.");
      });
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
