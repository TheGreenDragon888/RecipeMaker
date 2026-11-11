import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Keyboard } from 'react-native';
import type { RecipeServices } from '../../../src/createRecipeServices';
import type { PantryMatch } from '../../../src/services/findRecipesFromPantry';
import { ResultsScreen } from '../../../src/ui/screens/ResultsScreen';
import { isLoading, recipeCardNames, recipeCards, shownIcons, shownOfType, shownText, styleOf } from '../../support/screen';
import { colors } from '../../../src/ui/theme';

function makeMatch(id: number, name: string): PantryMatch {
  return {
    recipe: { id, name, totalTimeMinutes: 30, activeTimeMinutes: 15, servingsMin: 4, servingsMax: 4 },
    neededCount: 4,
    haveCount: 2,
    missingCount: 2,
  };
}

/** By default the pantry holds tomato and egg, and no recipes match. */
async function setup({
  pantry = ['tomato', 'egg'],
  findRecipesFromPantry = jest.fn().mockResolvedValue([]),
}: { pantry?: string[]; findRecipesFromPantry?: jest.Mock } = {}) {
  const services = { findRecipesFromPantry } as unknown as RecipeServices;
  const onOpenRecipe = jest.fn();
  const onBack = jest.fn();
  const resultsFor = (items: string[]) => (
    <ResultsScreen services={services} pantry={items} onOpenRecipe={onOpenRecipe} onBack={onBack} />
  );
  await render(resultsFor(pantry));
  /** Re-renders the screen with a different pantry list. */
  const showPantry = (items: string[]) => screen.rerender(resultsFor(items));
  return { findRecipesFromPantry, onOpenRecipe, onBack, showPantry };
}

/** A promise the test resolves or rejects later, to control when a service reply arrives. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

const backToPantryButtons = () => screen.getAllByRole('button', { name: 'Back to pantry' });
/** The back button at the top of the screen: the "Back to pantry" button with the chevron. */
const headerBackButton = () => backToPantryButtons().find((button) => shownIcons(button).includes('chevronLeft'))!;

describe('ResultsScreen', () => {
  describe('keyboard dismissal', () => {
    it('dismisses the number pad when filters are applied', async () => {
      const dismiss = jest.spyOn(Keyboard, 'dismiss');
      await setup({ findRecipesFromPantry: jest.fn().mockResolvedValue([makeMatch(1, 'Quick')]) });
      await fireEvent.press(screen.getByRole('button', { name: 'Filters' }));
      await fireEvent(screen.getByLabelText('Maximum active time in minutes'), 'focus');
      await fireEvent.press(screen.getByRole('button', { name: 'Apply filters' }));

      expect(dismiss).toHaveBeenCalled();
      dismiss.mockRestore();
    });

    it('dismisses the number pad when filters are cleared', async () => {
      const dismiss = jest.spyOn(Keyboard, 'dismiss');
      await setup();
      await fireEvent.press(screen.getByRole('button', { name: 'Filters' }));
      await fireEvent(screen.getByLabelText('Maximum active time in minutes'), 'focus');
      await fireEvent.press(screen.getByRole('button', { name: 'Clear filters' }));

      expect(dismiss).toHaveBeenCalled();
      dismiss.mockRestore();
    });

    it('dismisses the number pad when the user taps the page outside the filter fields', async () => {
      const dismiss = jest.spyOn(Keyboard, 'dismiss');
      await setup();
      await fireEvent.press(screen.getByRole('button', { name: 'Filters' }));
      await fireEvent(screen.getByLabelText('Maximum active time in minutes'), 'focus');
      dismiss.mockClear();
      await fireEvent.press(screen.getByTestId('results-screen'));

      expect(dismiss).toHaveBeenCalled();
      dismiss.mockRestore();
    });

    it('minimizes the filter panel when the user taps outside it', async () => {
      await setup();
      await fireEvent.press(screen.getByRole('button', { name: 'Filters' }));
      expect(shownText()).toContain('People Recipe Serves');

      await fireEvent.press(screen.getByTestId('results-screen'));

      expect(shownText()).not.toContain('People Recipe Serves');
      expect(screen.getByRole('button', { name: 'Filters' }).props.accessibilityState).toEqual({ expanded: false });
    });
  });

  describe('searching', () => {
    it('searches with the pantry list', async () => {
      const { findRecipesFromPantry } = await setup({ pantry: ['tomato', 'egg'] });
      expect(findRecipesFromPantry).toHaveBeenCalledWith(['tomato', 'egg']);
    });

    describe('filters', () => {
      it('minimizes the filter panel when the user scrolls down the recipe list', async () => {
        await setup({ findRecipesFromPantry: jest.fn().mockResolvedValue([makeMatch(1, 'Quick')]) });
        await fireEvent.press(screen.getByRole('button', { name: 'Filters' }));
        expect(shownText()).toContain('People Recipe Serves');

        await fireEvent.scroll(shownOfType('RCTScrollView')[0], {
          nativeEvent: { contentOffset: { x: 0, y: 40 }, contentSize: { height: 1000, width: 400 }, layoutMeasurement: { height: 600, width: 400 } },
        });

        expect(shownText()).not.toContain('People Recipe Serves');
        expect(screen.getByRole('button', { name: 'Filters' }).props.accessibilityState).toEqual({ expanded: false });
      });

      it('shows clear descriptions for serving range and Meal Prep filters', async () => {
        await setup();
        await fireEvent.press(screen.getByRole('button', { name: 'Filters' }));

        expect(shownText()).toContain('People Recipe Serves');
        expect(shownText()).not.toContain('Serving range');
        expect(shownText()).not.toContain('Include recipes whose serving range overlaps yours.');
        expect(shownText()).toContain('Recipes that serve 4+ and keep well when made ahead.');
      });

      it('applies a serving range and the Meal Prep tag to pantry results', async () => {
        const findRecipesFromPantry = jest
          .fn()
          .mockResolvedValueOnce([makeMatch(1, 'Regular')])
          .mockResolvedValueOnce([makeMatch(2, 'Meal Prep')]);
        await setup({ findRecipesFromPantry });

        await fireEvent.press(screen.getByRole('button', { name: 'Filters' }));
        await fireEvent.changeText(screen.getByLabelText('Minimum servings'), '2');
        await fireEvent.changeText(screen.getByLabelText('Maximum servings'), '4');
        await fireEvent.press(screen.getByRole('button', { name: 'Meal Prep only' }));
        await fireEvent.press(screen.getByRole('button', { name: 'Apply filters' }));

        expect(findRecipesFromPantry).toHaveBeenLastCalledWith(['tomato', 'egg'], {
          servingRange: { min: 2, max: 4 },
          mealPrepOnly: true,
        });
        expect(recipeCardNames()).toEqual(['Meal Prep']);
      });

      it('applies the maximum active cooking time', async () => {
        const findRecipesFromPantry = jest
          .fn()
          .mockResolvedValueOnce([makeMatch(1, 'Regular')])
          .mockResolvedValueOnce([makeMatch(2, 'Quick')]);
        await setup({ findRecipesFromPantry });

        await fireEvent.press(screen.getByRole('button', { name: 'Filters' }));
        await fireEvent.changeText(screen.getByLabelText('Maximum active time in minutes'), '30');
        await fireEvent.press(screen.getByRole('button', { name: 'Apply filters' }));

        expect(findRecipesFromPantry).toHaveBeenLastCalledWith(['tomato', 'egg'], {
          maxActiveMinutes: 30,
        });
        expect(recipeCardNames()).toEqual(['Quick']);
      });

      it('highlights the filter button when filters are applied', async () => {
        await setup();
        const filtersButton = () => screen.getByRole('button', { name: 'Filters' });
        await fireEvent.press(screen.getByRole('button', { name: 'Filters' }));
        await fireEvent.changeText(screen.getByLabelText('Maximum active time in minutes'), '30');
        await fireEvent.press(screen.getByRole('button', { name: 'Apply filters' }));

        expect(styleOf(filtersButton()).backgroundColor).toBe(colors.accentTint);
      });

      it('clears applied filters and reloads the full pantry results', async () => {
        const findRecipesFromPantry = jest
          .fn()
          .mockResolvedValueOnce([makeMatch(3, 'Initial pantry results')])
          .mockResolvedValueOnce([makeMatch(1, 'Filtered')])
          .mockResolvedValueOnce([makeMatch(2, 'All pantry results')]);
        await setup({ findRecipesFromPantry });

        await fireEvent.press(screen.getByRole('button', { name: 'Filters' }));
        await fireEvent.changeText(screen.getByLabelText('Minimum servings'), '2');
        await fireEvent.changeText(screen.getByLabelText('Maximum servings'), '4');
        await fireEvent.press(screen.getByRole('button', { name: 'Apply filters' }));
        await waitFor(() =>
          expect(findRecipesFromPantry).toHaveBeenLastCalledWith(['tomato', 'egg'], {
            servingRange: { min: 2, max: 4 },
          }),
        );
        await waitFor(() => expect(recipeCardNames()).toEqual(['Filtered']));
        await fireEvent.press(screen.getByRole('button', { name: 'Clear filters' }));

        expect(findRecipesFromPantry).toHaveBeenLastCalledWith(['tomato', 'egg']);
        await waitFor(() => expect(recipeCardNames()).toEqual(['All pantry results']));
      });

      it('does not apply an invalid serving range', async () => {
        const { findRecipesFromPantry } = await setup();
        await fireEvent.press(screen.getByRole('button', { name: 'Filters' }));
        await fireEvent.changeText(screen.getByLabelText('Minimum servings'), '5');
        await fireEvent.changeText(screen.getByLabelText('Maximum servings'), '3');
        await fireEvent.press(screen.getByRole('button', { name: 'Apply filters' }));

        expect(findRecipesFromPantry).toHaveBeenCalledTimes(1);
        expect(shownText()).toContain('Maximum servings must be at least the minimum.');
      });

      it('explains when active filters leave no matching recipes', async () => {
        const findRecipesFromPantry = jest.fn().mockResolvedValueOnce([makeMatch(1, 'Initial')]).mockResolvedValueOnce([]);
        await setup({ findRecipesFromPantry });
        await fireEvent.press(screen.getByRole('button', { name: 'Filters' }));
        await fireEvent.press(screen.getByRole('button', { name: 'Meal Prep only' }));
        await fireEvent.press(screen.getByRole('button', { name: 'Apply filters' }));

        await waitFor(() => expect(shownText()).toContain('No recipes match your pantry and filters.'));
      });
    });

    it('shows a loading indicator while recipes load', async () => {
      await setup({ findRecipesFromPantry: jest.fn().mockReturnValue(deferred().promise) });
      expect(isLoading()).toBe(true);
    });

    it('hides the loading indicator once recipes arrive', async () => {
      await setup({ findRecipesFromPantry: jest.fn().mockResolvedValue([makeMatch(1, 'Shakshuka')]) });
      expect(isLoading()).toBe(false);
    });

    it('ignores results for an earlier pantry list', async () => {
      const forEgg = deferred<PantryMatch[]>();
      const forTomato = deferred<PantryMatch[]>();
      const findRecipesFromPantry = jest.fn().mockReturnValueOnce(forEgg.promise).mockReturnValueOnce(forTomato.promise);
      const { showPantry } = await setup({ pantry: ['egg'], findRecipesFromPantry });
      await showPantry(['tomato']);

      await act(async () => forTomato.resolve([makeMatch(2, 'Tomato Soup')]));
      await act(async () => forEgg.resolve([makeMatch(1, 'Omelet')]));

      expect(recipeCardNames()).toEqual(['Tomato Soup']);
    });
  });

  describe('results', () => {
    it('shows the name of each recipe found', async () => {
      await setup({
        findRecipesFromPantry: jest.fn().mockResolvedValue([makeMatch(1, 'Shakshuka'), makeMatch(2, 'Egg Fried Rice')]),
      });
      expect(shownText()).toEqual(expect.arrayContaining(['Shakshuka', 'Egg Fried Rice']));
    });

    it('lists the recipes in the order the service returns them', async () => {
      await setup({
        findRecipesFromPantry: jest.fn().mockResolvedValue([makeMatch(2, 'Egg Fried Rice'), makeMatch(1, 'Shakshuka')]),
      });
      expect(recipeCardNames()).toEqual(['Egg Fried Rice', 'Shakshuka']);
    });

    it('shows how many pantry ingredients it matched against', async () => {
      await setup({ pantry: ['tomato', 'egg'] });
      expect(shownText()).toContain('Matched against your 2 pantry ingredients');
    });

    it('leaves out the matched-against line when the pantry list is empty', async () => {
      await setup({ pantry: [] });
      expect(shownText().some((text) => text.startsWith('Matched against'))).toBe(false);
    });

    it('opens a recipe when its card is pressed', async () => {
      const { onOpenRecipe } = await setup({
        findRecipesFromPantry: jest.fn().mockResolvedValue([makeMatch(1, 'Shakshuka'), makeMatch(2, 'Egg Fried Rice')]),
      });
      await fireEvent.press(recipeCards()[1]);
      expect(onOpenRecipe).toHaveBeenCalledWith(2);
    });

    it('goes back to the pantry when the back button is pressed', async () => {
      const { onBack } = await setup();
      await fireEvent.press(headerBackButton());
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('labels the back button for screen readers', async () => {
      await setup();
      expect(headerBackButton()).toHaveAccessibleName('Back to pantry');
    });
  });

  describe('no results', () => {
    it('shows a message when no recipes match', async () => {
      await setup({ findRecipesFromPantry: jest.fn().mockResolvedValue([]) });
      expect(shownText()).toContain('No recipes match your pantry.');
    });

    it('offers a way back to the pantry when no recipes match', async () => {
      const { onBack } = await setup({ findRecipesFromPantry: jest.fn().mockResolvedValue([]) });
      const messageButton = backToPantryButtons().find((button) => button !== headerBackButton())!;
      await fireEvent.press(messageButton);
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('shows an error message when the search fails', async () => {
      await setup({ findRecipesFromPantry: jest.fn().mockRejectedValue(new Error('database busy')) });
      expect(shownText()).toContain("Couldn't load recipes.");
    });

    it('does not show the no-match message when the search fails', async () => {
      await setup({ findRecipesFromPantry: jest.fn().mockRejectedValue(new Error('database busy')) });
      expect(shownText()).not.toContain('No recipes match your pantry.');
    });
  });
});
