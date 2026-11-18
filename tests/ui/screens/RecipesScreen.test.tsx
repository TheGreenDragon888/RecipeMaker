import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { RecipeServices } from '../../../src/createRecipeServices';
import type { RecipeSummary } from '../../../src/domain/recipe';
import type { RecipeReadiness } from '../../../src/domain/recipeReadiness';
import { RecipesScreen } from '../../../src/ui/screens/RecipesScreen';
import { dock } from '../../../src/ui/theme';
import { isLoading, listContentStyle, listWindow, recipeCardNames, recipeCards, shownText } from '../../support/screen';

function makeSummary(id: number, name: string): RecipeSummary {
  return { id, name, totalTimeMinutes: 30, activeTimeMinutes: 15, servingsMin: 4, servingsMax: 4 };
}

/** By default the service returns no recipes. */
async function setup({
  listAllRecipes = jest.fn().mockResolvedValue([]),
  searchRecipes = jest.fn().mockResolvedValue([]),
  listBookmarkIds = jest.fn().mockResolvedValue([]),
  addBookmark = jest.fn().mockResolvedValue(undefined),
  removeBookmark = jest.fn().mockResolvedValue(undefined),
  checkRecipesReadiness = jest.fn().mockResolvedValue(null),
  bottomClearance,
}: {
  listAllRecipes?: jest.Mock;
  searchRecipes?: jest.Mock;
  listBookmarkIds?: jest.Mock;
  addBookmark?: jest.Mock;
  removeBookmark?: jest.Mock;
  checkRecipesReadiness?: jest.Mock;
  bottomClearance?: number;
} = {}) {
  const services = {
    listAllRecipes,
    searchRecipes,
    listBookmarkIds,
    addBookmark,
    removeBookmark,
    checkRecipesReadiness,
  } as unknown as RecipeServices;
  const onOpenRecipe = jest.fn();
  const screenFor = (refreshKey: number) => (
    <RecipesScreen services={services} onOpenRecipe={onOpenRecipe} bottomClearance={bottomClearance} refreshKey={refreshKey} />
  );
  await render(screenFor(0));
  /** Redraws the screen as its route does when it comes back into view. */
  const comeBack = () => screen.rerender(screenFor(1));
  return { listAllRecipes, searchRecipes, listBookmarkIds, addBookmark, removeBookmark, onOpenRecipe, comeBack };
}

const never = () => new Promise<never>(() => {});

describe('RecipesScreen bookmarks', () => {
  const chili = makeSummary(1, 'Chili');
  const listAllRecipes = () => jest.fn().mockResolvedValue([chili]);

  it('offers to save a recipe that is not saved', async () => {
    await setup({ listAllRecipes: listAllRecipes() });
    expect(screen.getByRole('button', { name: 'Save Chili' })).toBeOnTheScreen();
  });

  it('shows a saved recipe as saved', async () => {
    await setup({ listAllRecipes: listAllRecipes(), listBookmarkIds: jest.fn().mockResolvedValue([1]) });
    expect(screen.getByRole('button', { name: 'Remove Chili from bookmarks' })).toBeOnTheScreen();
  });

  it('saves the recipe when its button is tapped', async () => {
    const { addBookmark } = await setup({ listAllRecipes: listAllRecipes() });
    await fireEvent.press(screen.getByRole('button', { name: 'Save Chili' }));
    expect(addBookmark).toHaveBeenCalledWith(1);
  });

  it('does not open the recipe when its button is tapped', async () => {
    const { onOpenRecipe } = await setup({ listAllRecipes: listAllRecipes() });
    await fireEvent.press(screen.getByRole('button', { name: 'Save Chili' }));
    expect(onOpenRecipe).not.toHaveBeenCalled();
  });

  it('shows no bookmark buttons when the saved recipes cannot load', async () => {
    await setup({ listAllRecipes: listAllRecipes(), listBookmarkIds: jest.fn().mockRejectedValue(new Error('corrupt')) });
    expect(screen.queryByRole('button', { name: 'Save Chili' })).toBeNull();
  });

  it('still lists the recipes when the saved recipes cannot load', async () => {
    await setup({ listAllRecipes: listAllRecipes(), listBookmarkIds: jest.fn().mockRejectedValue(new Error('corrupt')) });
    expect(recipeCardNames()).toEqual(['Chili']);
  });

  it('says so when a bookmark cannot be saved', async () => {
    await setup({ listAllRecipes: listAllRecipes(), addBookmark: jest.fn().mockRejectedValue(new Error('full')) });
    await fireEvent.press(screen.getByRole('button', { name: 'Save Chili' }));
    expect(screen.getByRole('alert')).toHaveTextContent("Couldn't update your bookmark.");
  });

  it('picks up a bookmark changed on another screen when it comes back into view', async () => {
    const listBookmarkIds = jest.fn().mockResolvedValue([]);
    const { comeBack } = await setup({ listAllRecipes: listAllRecipes(), listBookmarkIds });
    listBookmarkIds.mockResolvedValue([1]);
    await comeBack();
    expect(screen.getByRole('button', { name: 'Remove Chili from bookmarks' })).toBeOnTheScreen();
  });

  it('does not load the recipes again when it comes back into view', async () => {
    const list = listAllRecipes();
    const { comeBack } = await setup({ listAllRecipes: list });
    await comeBack();
    expect(list).toHaveBeenCalledTimes(1);
  });
});

describe('RecipesScreen readiness', () => {
  const chili = makeSummary(1, 'Chili');
  const ready: RecipeReadiness = { status: 'ready', onHandCount: 4, neededCount: 4, toBuy: [], swaps: [] };
  const almost: RecipeReadiness = {
    status: 'almost',
    onHandCount: 3,
    neededCount: 4,
    toBuy: [{ ingredient: 'beans', kind: 'missing' }],
    swaps: [],
  };
  const listAllRecipes = () => jest.fn().mockResolvedValue([chili]);
  const settle = () => act(async () => {});

  it("shows a recipe's status from the saved pantry", async () => {
    await setup({ listAllRecipes: listAllRecipes(), checkRecipesReadiness: jest.fn().mockResolvedValue(new Map([[1, almost]])) });
    await settle();
    expect(shownText()).toEqual(expect.arrayContaining(['1-2 items needed', '3/4 · need beans']));
  });

  it('checks the recipes in the list', async () => {
    const checkRecipesReadiness = jest.fn().mockResolvedValue(new Map([[1, ready]]));
    await setup({ listAllRecipes: listAllRecipes(), checkRecipesReadiness });
    await settle();
    expect(checkRecipesReadiness).toHaveBeenCalledWith([1]);
  });

  it('checks only the cards the list has built', async () => {
    const many = Array.from({ length: 40 }, (_, i) => makeSummary(i + 1, `Recipe ${i + 1}`));
    const checkRecipesReadiness = jest.fn().mockResolvedValue(new Map());
    await setup({ listAllRecipes: jest.fn().mockResolvedValue(many), checkRecipesReadiness });
    await settle();
    expect(checkRecipesReadiness.mock.calls.flatMap(([ids]) => ids).length).toBeLessThan(many.length);
  });

  it('shows a searched recipe with its status', async () => {
    jest.useFakeTimers();
    try {
      const soup = makeSummary(2, 'Soup');
      await setup({
        listAllRecipes: listAllRecipes(),
        searchRecipes: jest.fn().mockResolvedValue([soup]),
        checkRecipesReadiness: jest.fn().mockResolvedValue(new Map([[2, ready]])),
      });
      await fireEvent.changeText(screen.getByLabelText('Search recipes'), 'soup');
      await act(async () => {
        jest.advanceTimersByTime(250);
      });
      await settle();
      expect(shownText()).toContain('Ready to cook');
    } finally {
      jest.useRealTimers();
    }
  });

  it('shows plain cards with an empty pantry', async () => {
    await setup({ listAllRecipes: listAllRecipes() });
    await settle();
    expect(shownText()).toEqual(['All Recipes', 'Chili', '30 min']);
  });

  it('says so when the pantry cannot be checked', async () => {
    await setup({ listAllRecipes: listAllRecipes(), checkRecipesReadiness: jest.fn().mockRejectedValue(new Error('corrupt')) });
    await settle();
    expect(shownText()).toContain("Couldn't check your pantry.");
  });

  it('still lists the recipes when the pantry cannot be checked', async () => {
    await setup({ listAllRecipes: listAllRecipes(), checkRecipesReadiness: jest.fn().mockRejectedValue(new Error('corrupt')) });
    await settle();
    expect(recipeCardNames()).toEqual(['Chili']);
  });

  it('picks up a pantry change when it comes back into view', async () => {
    const checkRecipesReadiness = jest.fn().mockResolvedValue(new Map([[1, almost]]));
    const { comeBack } = await setup({ listAllRecipes: listAllRecipes(), checkRecipesReadiness });
    await settle();
    checkRecipesReadiness.mockResolvedValue(new Map([[1, ready]]));
    await comeBack();
    await settle();
    expect(shownText()).toContain('Ready to cook');
  });
});

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
    it('has the title "All Recipes"', async () => {
      await setup();
      expect(shownText()).toContain('All Recipes');
    });

    describe('search', () => {
      afterEach(() => jest.useRealTimers());

      it('shows a search field matching the pantry field prompt', async () => {
        await setup();
        expect(screen.getByLabelText('Search recipes')).toBeTruthy();
        expect(screen.getByPlaceholderText('Search all recipes…')).toBeTruthy();
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

      describe('the clear button', () => {
        it('is hidden while the search box is empty', async () => {
          await setup();
          expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
        });

        it('shows once something is typed', async () => {
          await setup();
          await fireEvent.changeText(screen.getByLabelText('Search recipes'), 'p');
          expect(screen.getByRole('button', { name: 'Clear search' })).toBeTruthy();
        });

        it('empties the search box', async () => {
          await setup();
          await fireEvent.changeText(screen.getByLabelText('Search recipes'), 'potato');
          await fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));
          expect(screen.getByLabelText('Search recipes').props.value).toBe('');
        });

        it('hides itself after clearing', async () => {
          await setup();
          await fireEvent.changeText(screen.getByLabelText('Search recipes'), 'potato');
          await fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));
          expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
        });

        it('brings back the full list', async () => {
          await setup({
            listAllRecipes: jest.fn().mockResolvedValue([makeSummary(1, 'Apple Pie'), makeSummary(2, 'Potato Soup')]),
            searchRecipes: jest.fn().mockResolvedValue([makeSummary(2, 'Potato Soup')]),
          });
          jest.useFakeTimers();
          await fireEvent.changeText(screen.getByLabelText('Search recipes'), 'potato');
          await act(async () => {
            jest.advanceTimersByTime(250);
          });

          await fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));
          expect(recipeCardNames()).toEqual(['Apple Pie', 'Potato Soup']);
        });
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

    // Every card the list has built redraws when the tab opens. The default window built about 99 of them and made
    // switching to this tab lag (measured on the experiment/tab-lag branch), so the list builds fewer at a time.
    describe('builds only the cards near the screen', () => {
      const allRecipes = Array.from({ length: 594 }, (_, i) => makeSummary(i + 1, `Recipe ${i + 1}`));

      it('builds at most 8 cards before the list has measured itself', async () => {
        await setup({ listAllRecipes: jest.fn().mockResolvedValue(allRecipes) });
        expect(recipeCards().length).toBeLessThanOrEqual(8);
      });

      it('keeps about two screens of cards beyond the visible ones', async () => {
        await setup({ listAllRecipes: jest.fn().mockResolvedValue(allRecipes) });
        expect(listWindow().windowSize).toBe(5);
      });

      it('adds at most 8 cards at a time while scrolling', async () => {
        await setup({ listAllRecipes: jest.fn().mockResolvedValue(allRecipes) });
        expect(listWindow().maxToRenderPerBatch).toBe(8);
      });
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
