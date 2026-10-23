import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { RecipeServices } from '../../../src/createRecipeServices';
import type { PantryMatch } from '../../../src/services/findRecipesFromPantry';
import { ResultsScreen } from '../../../src/ui/screens/ResultsScreen';
import { isLoading, recipeCardNames, recipeCards, shownIcons, shownText } from '../../support/screen';

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
  describe('searching', () => {
    it('searches with the pantry list', async () => {
      const { findRecipesFromPantry } = await setup({ pantry: ['tomato', 'egg'] });
      expect(findRecipesFromPantry).toHaveBeenCalledWith(['tomato', 'egg']);
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
