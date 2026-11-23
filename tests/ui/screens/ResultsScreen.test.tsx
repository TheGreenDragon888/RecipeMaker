import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { RecipeServices } from '../../../src/createRecipeServices';
import type { ReadinessStatus, RecipeReadiness } from '../../../src/domain/recipeReadiness';
import type { PantryMatch } from '../../../src/services/findRecipesFromPantry';
import { ResultsScreen } from '../../../src/ui/screens/ResultsScreen';
import { isLoading, recipeCardNames, recipeCards, shownIcons, shownText, styleOf } from '../../support/screen';

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
  listBookmarkIds = jest.fn().mockResolvedValue([]),
  addBookmark = jest.fn().mockResolvedValue(undefined),
  removeBookmark = jest.fn().mockResolvedValue(undefined),
  checkRecipesReadiness = jest.fn().mockResolvedValue(null),
  bottomInset,
}: {
  pantry?: string[];
  findRecipesFromPantry?: jest.Mock;
  listBookmarkIds?: jest.Mock;
  addBookmark?: jest.Mock;
  removeBookmark?: jest.Mock;
  checkRecipesReadiness?: jest.Mock;
  bottomInset?: number;
} = {}) {
  const services = {
    findRecipesFromPantry,
    listBookmarkIds,
    addBookmark,
    removeBookmark,
    checkRecipesReadiness,
  } as unknown as RecipeServices;
  const onOpenRecipe = jest.fn();
  const onBack = jest.fn();
  const resultsFor = (items: string[]) => (
    <ResultsScreen services={services} pantry={items} onOpenRecipe={onOpenRecipe} onBack={onBack} bottomInset={bottomInset} />
  );
  await render(resultsFor(pantry));
  /** Re-renders the screen with a different pantry list. */
  const showPantry = (items: string[]) => screen.rerender(resultsFor(items));
  return { findRecipesFromPantry, addBookmark, removeBookmark, onOpenRecipe, onBack, showPantry };
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

describe('ResultsScreen bookmarks', () => {
  const findRecipesFromPantry = () => jest.fn().mockResolvedValue([makeMatch(1, 'Chili')]);

  it('offers to save a recipe that is not saved', async () => {
    await setup({ findRecipesFromPantry: findRecipesFromPantry() });
    expect(screen.getByRole('button', { name: 'Save Chili' })).toBeOnTheScreen();
  });

  it('saves the recipe when its button is tapped', async () => {
    const { addBookmark } = await setup({ findRecipesFromPantry: findRecipesFromPantry() });
    await fireEvent.press(screen.getByRole('button', { name: 'Save Chili' }));
    expect(addBookmark).toHaveBeenCalledWith(1);
  });

  it('removes a saved recipe when its button is tapped', async () => {
    const { removeBookmark } = await setup({
      findRecipesFromPantry: findRecipesFromPantry(),
      listBookmarkIds: jest.fn().mockResolvedValue([1]),
    });
    await fireEvent.press(screen.getByRole('button', { name: 'Remove Chili from bookmarks' }));
    expect(removeBookmark).toHaveBeenCalledWith(1);
  });

  it('says so when a bookmark cannot be saved', async () => {
    await setup({ findRecipesFromPantry: findRecipesFromPantry(), addBookmark: jest.fn().mockRejectedValue(new Error('full')) });
    await fireEvent.press(screen.getByRole('button', { name: 'Save Chili' }));
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't update your bookmark.");
  });
});

describe('ResultsScreen readiness', () => {
  const withStatus = (status: ReadinessStatus): RecipeReadiness => ({
    status,
    onHandCount: 2,
    neededCount: 4,
    toBuy: status === 'almost' ? [{ ingredient: 'beans', kind: 'missing' }] : [],
    swaps: status === 'swap' ? [{ ingredient: 'soy sauce', substitute: 'tamari' }] : [],
  });
  const matches = [makeMatch(1, 'Chili'), makeMatch(2, 'Stir-Fry'), makeMatch(3, 'Soup'), makeMatch(4, 'Stew')];
  const statuses = new Map<number, RecipeReadiness>([
    [1, withStatus('ready')],
    [2, withStatus('swap')],
    [3, withStatus('almost')],
    [4, withStatus('needsMore')],
  ]);
  const settle = () => act(async () => {});
  const setupChecked = async (checkRecipesReadiness = jest.fn().mockResolvedValue(statuses)) => {
    const shown = await setup({ findRecipesFromPantry: jest.fn().mockResolvedValue(matches), checkRecipesReadiness });
    await settle();
    return { ...shown, checkRecipesReadiness };
  };
  const chip = (name: string) => screen.getByRole('button', { name });
  const shownRecipes = () => ['Chili', 'Stir-Fry', 'Soup', 'Stew'].filter((name) => screen.queryByText(name));

  it('checks the recipes it found', async () => {
    const { checkRecipesReadiness } = await setupChecked();
    expect(checkRecipesReadiness).toHaveBeenCalledWith([1, 2, 3, 4]);
  });

  it("shows each recipe's status", async () => {
    await setupChecked();
    expect(shownText()).toEqual(expect.arrayContaining(['Ready to cook', 'Swap available', '1-2 items needed']));
  });

  it('shows what a recipe still needs', async () => {
    await setupChecked();
    expect(shownText()).toContain('2/4 · need beans');
  });

  it('keeps the on-hand count when the pantry cannot be checked', async () => {
    await setupChecked(jest.fn().mockRejectedValue(new Error('corrupt')));
    expect(shownText()).toContain('2/4 ingredients on hand');
  });

  it('says so when the pantry cannot be checked', async () => {
    await setupChecked(jest.fn().mockRejectedValue(new Error('corrupt')));
    expect(shownText()).toContain("Couldn't check your pantry.");
  });

  describe('filter chips', () => {
    it('counts the recipes under each chip', async () => {
      await setupChecked();
      expect([chip('All, 4'), chip('Ready now, 1'), chip('Swap, 1'), chip('Almost there, 1')]).toHaveLength(4);
    });

    it('starts on All', async () => {
      await setupChecked();
      expect(chip('All, 4')).toBeSelected();
    });

    it('shows every recipe under All', async () => {
      await setupChecked();
      expect(shownRecipes()).toEqual(['Chili', 'Stir-Fry', 'Soup', 'Stew']);
    });

    it('shows only ready recipes under Ready now', async () => {
      await setupChecked();
      await fireEvent.press(chip('Ready now, 1'));
      expect(shownRecipes()).toEqual(['Chili']);
    });

    it('shows only swap recipes under Swap', async () => {
      await setupChecked();
      await fireEvent.press(chip('Swap, 1'));
      expect(shownRecipes()).toEqual(['Stir-Fry']);
    });

    it('shows only nearly ready recipes under Almost there', async () => {
      await setupChecked();
      await fireEvent.press(chip('Almost there, 1'));
      expect(shownRecipes()).toEqual(['Soup']);
    });

    it('goes back to every recipe under All', async () => {
      await setupChecked();
      await fireEvent.press(chip('Swap, 1'));
      await fireEvent.press(chip('All, 4'));
      expect(shownRecipes()).toHaveLength(4);
    });

    it('says so when a chip holds no recipes', async () => {
      await setupChecked(jest.fn().mockResolvedValue(new Map([[1, withStatus('ready')]])));
      await fireEvent.press(chip('Swap, 0'));
      expect(shownText()).toContain('No recipes match this filter.');
    });

    it('keeps the chips showing when a chip holds no recipes', async () => {
      await setupChecked(jest.fn().mockResolvedValue(new Map([[1, withStatus('ready')]])));
      await fireEvent.press(chip('Swap, 0'));
      expect(chip('All, 4')).toBeOnTheScreen();
    });

    it('hides the chips with no pantry to check against', async () => {
      await setupChecked(jest.fn().mockResolvedValue(null));
      expect(screen.queryByRole('button', { name: 'All, 4' })).toBeNull();
    });

    it('hides the chips when the pantry cannot be checked', async () => {
      await setupChecked(jest.fn().mockRejectedValue(new Error('corrupt')));
      expect(screen.queryByRole('button', { name: 'All, 4' })).toBeNull();
    });

    it('hides the chips when no recipes were found', async () => {
      await setup({ checkRecipesReadiness: jest.fn().mockResolvedValue(statuses) });
      await settle();
      expect(screen.queryByRole('button', { name: 'All, 0' })).toBeNull();
    });
  });
});

describe('ResultsScreen filters', () => {
  /** Lets replies arrive and the sheet finish sliding (its slide runs on timers). */
  const settle = () =>
    act(async () => {
      jest.advanceTimersByTime(1000);
    });
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const pantry = ['tomato', 'egg'];
  const filtersButton = (name = 'Filters') => screen.getByRole('button', { name });
  const openFilters = async () => {
    await fireEvent.press(filtersButton());
    await settle();
  };
  const choose = (name: string) => fireEvent.press(screen.getByRole('button', { name }));
  const showRecipes = (count: number) => screen.getByRole('button', { name: `Show ${count} ${count === 1 ? 'recipe' : 'recipes'}` });

  it('puts a Filters button under the title', async () => {
    await setup();
    expect(filtersButton()).toBeOnTheScreen();
  });

  it('is closed until the Filters button is tapped', async () => {
    await setup();
    expect(shownText()).not.toContain('Hands-on cooking time');
  });

  it('offers hands-on time, number of people and Meal Prep', async () => {
    await setup();
    await openFilters();
    expect(shownText()).toEqual(expect.arrayContaining(['Hands-on cooking time', 'Number of people', 'Meal Prep']));
  });

  it('has no text fields to fill in', async () => {
    await setup();
    await openFilters();
    expect(screen.queryByLabelText('Minimum servings')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Apply filters' })).toBeNull();
  });

  it('stands on the screen\'s bottom edge, leaving room for the home indicator', async () => {
    await setup({ bottomInset: 34 });
    await openFilters();
    expect(styleOf(screen.getByTestId('bottom-sheet')).paddingBottom).toBe(34);
  });

  describe('counting', () => {
    it('counts the pantry results with no filters when nothing is selected', async () => {
      const findRecipesFromPantry = jest.fn().mockResolvedValue([makeMatch(1, 'Shakshuka'), makeMatch(2, 'Egg Fried Rice')]);
      await setup({ findRecipesFromPantry });
      await openFilters();
      expect(findRecipesFromPantry).toHaveBeenLastCalledWith(pantry);
      expect(showRecipes(2)).toBeOnTheScreen();
    });

    it('counts the pantry results the choices find', async () => {
      const findRecipesFromPantry = jest
        .fn()
        .mockResolvedValueOnce([makeMatch(1, 'Regular'), makeMatch(2, 'Quick'), makeMatch(3, 'Slow')])
        .mockResolvedValue([makeMatch(2, 'Quick')]);
      await setup({ findRecipesFromPantry });
      await openFilters();
      await choose('30 min');
      await settle();
      expect(findRecipesFromPantry).toHaveBeenLastCalledWith(pantry, { maxActiveMinutes: 30 });
      expect(showRecipes(1)).toBeOnTheScreen();
    });
  });

  describe('applying', () => {
    it('searches the pantry again with the choices once the sheet closes', async () => {
      const findRecipesFromPantry = jest
        .fn()
        .mockResolvedValueOnce([makeMatch(1, 'Regular')])
        .mockResolvedValue([makeMatch(2, 'Quick')]);
      await setup({ findRecipesFromPantry });
      await openFilters();
      await choose('30 min');
      await settle();
      await fireEvent.press(showRecipes(1));
      await settle();
      expect(findRecipesFromPantry).toHaveBeenLastCalledWith(pantry, { maxActiveMinutes: 30 });
      expect(recipeCardNames()).toEqual(['Quick']);
    });

    it('applies the number of people and Meal Prep together', async () => {
      const findRecipesFromPantry = jest.fn().mockResolvedValue([makeMatch(1, 'Meal Prep')]);
      await setup({ findRecipesFromPantry });
      await openFilters();
      await fireEvent.press(screen.getByRole('button', { name: 'More people' }));
      await fireEvent.press(screen.getByRole('switch', { name: 'Meal Prep' }));
      await settle();
      await fireEvent.press(showRecipes(1));
      await settle();
      expect(findRecipesFromPantry).toHaveBeenLastCalledWith(pantry, { people: 1, mealPrepOnly: true });
    });

    it('keeps the choices when the sheet is closed from its backdrop', async () => {
      const findRecipesFromPantry = jest.fn().mockResolvedValueOnce([makeMatch(1, 'Regular')]).mockResolvedValue([makeMatch(2, 'Quick')]);
      await setup({ findRecipesFromPantry });
      await openFilters();
      await choose('15 min');
      await fireEvent.press(screen.getAllByRole('button', { name: 'Close filters' })[0]);
      await settle();
      expect(recipeCardNames()).toEqual(['Quick']);
    });

    it('shows on the Filters button how many are selected', async () => {
      await setup({ findRecipesFromPantry: jest.fn().mockResolvedValue([makeMatch(1, 'Quick')]) });
      await openFilters();
      await choose('30 min');
      await fireEvent.press(screen.getByRole('switch', { name: 'Meal Prep' }));
      await settle();
      await fireEvent.press(showRecipes(1));
      await settle();
      expect(filtersButton('Filters, 2 active')).toBeOnTheScreen();
    });

    it('does not search again when the sheet closes with the same choices', async () => {
      const { findRecipesFromPantry } = await setup({ findRecipesFromPantry: jest.fn().mockResolvedValue([makeMatch(1, 'Quick')]) });
      await openFilters();
      await fireEvent.press(showRecipes(1));
      await settle();
      expect(findRecipesFromPantry).toHaveBeenCalledTimes(2); // the first search, and the sheet's count
      expect(findRecipesFromPantry).toHaveBeenLastCalledWith(pantry);
    });

    it('reloads the full pantry results when the choices are reset', async () => {
      // Answers by what was asked, since the sheet's counts call the service too.
      const findRecipesFromPantry = jest.fn(async (_pantry: string[], filters?: unknown) =>
        filters ? [makeMatch(1, 'Filtered')] : [makeMatch(2, 'All pantry results')],
      );
      await setup({ findRecipesFromPantry });
      await openFilters();
      await choose('30 min');
      await settle();
      await fireEvent.press(showRecipes(1));
      await settle();
      expect(recipeCardNames()).toEqual(['Filtered']);

      await fireEvent.press(filtersButton('Filters, 1 active'));
      await settle();
      await fireEvent.press(screen.getByRole('button', { name: 'Reset filters' }));
      await settle();
      await fireEvent.press(showRecipes(1));
      await settle();

      expect(findRecipesFromPantry).toHaveBeenLastCalledWith(pantry);
      expect(recipeCardNames()).toEqual(['All pantry results']);
    });

    it('explains when active filters leave no matching recipes', async () => {
      const findRecipesFromPantry = jest.fn().mockResolvedValueOnce([makeMatch(1, 'Initial')]).mockResolvedValue([]);
      await setup({ findRecipesFromPantry });
      await openFilters();
      await fireEvent.press(screen.getByRole('switch', { name: 'Meal Prep' }));
      await settle();
      await fireEvent.press(showRecipes(0));
      await settle();
      expect(shownText()).toContain('No recipes match your pantry and filters.');
    });
  });
});

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
