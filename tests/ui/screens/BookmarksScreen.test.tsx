import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { RecipeServices } from '../../../src/createRecipeServices';
import type { SavedRecipe } from '../../../src/domain/bookmarks';
import type { ReadinessStatus, RecipeReadiness } from '../../../src/domain/recipeReadiness';
import { BookmarksScreen, UNDO_BOOKMARK_MS } from '../../../src/ui/screens/BookmarksScreen';
import { BOOKMARK_NOTICE_MS } from '../../../src/ui/useRecipeBookmarks';
import { StyleSheet } from 'react-native';
import { isLoading, recipeCards, shownOfType, shownText, styleOf } from '../../support/screen';

const saved = (id: number, name: string): SavedRecipe => ({
  savedOrder: 10 - id,
  recipe: { id, name, totalTimeMinutes: 30, activeTimeMinutes: 15, servingsMin: 4, servingsMax: 4 },
});

const pasta = saved(1, 'Garlic Pasta');
const stirFry = saved(2, 'Chicken Stir-Fry');
const salmon = saved(3, 'Lemon Salmon');
const stew = saved(4, 'Beef Stew');
const everything = [pasta, stirFry, salmon, stew];
const titles = everything.map(({ recipe }) => recipe.name);

function readiness(status: ReadinessStatus): RecipeReadiness {
  const toBuy = status === 'almost' ? 1 : status === 'needsMore' ? 3 : 0;
  return {
    status,
    onHandCount: 2,
    neededCount: 3,
    toBuy: Array.from({ length: toBuy }, (_, i) => ({ ingredient: `item ${i + 1}`, kind: 'missing' as const })),
    swaps: status === 'swap' ? [{ ingredient: 'soy sauce', substitute: 'tamari' }] : [],
  };
}

const allChecked = new Map<number, RecipeReadiness>([
  [1, readiness('ready')],
  [2, readiness('swap')],
  [3, readiness('almost')],
  [4, readiness('needsMore')],
]);

/** By default four recipes are saved and each has a different readiness. */
async function setup({
  listBookmarks = jest.fn().mockResolvedValue(everything),
  checkRecipesReadiness = jest.fn().mockResolvedValue(allChecked),
  removeBookmark = jest.fn().mockResolvedValue(undefined),
  restoreBookmark = jest.fn().mockResolvedValue(undefined),
  bottomClearance = 110,
}: {
  listBookmarks?: jest.Mock;
  checkRecipesReadiness?: jest.Mock;
  removeBookmark?: jest.Mock;
  restoreBookmark?: jest.Mock;
  bottomClearance?: number;
} = {}) {
  const services = { listBookmarks, checkRecipesReadiness, removeBookmark, restoreBookmark } as unknown as RecipeServices;
  const onOpenRecipe = jest.fn();
  const onBrowseRecipes = jest.fn();
  const screenFor = (refreshKey: number) => (
    <BookmarksScreen
      services={services}
      onOpenRecipe={onOpenRecipe}
      onBrowseRecipes={onBrowseRecipes}
      bottomClearance={bottomClearance}
      refreshKey={refreshKey}
    />
  );
  await render(screenFor(0));
  const comeBack = () => screen.rerender(screenFor(1));
  return { listBookmarks, checkRecipesReadiness, removeBookmark, restoreBookmark, onOpenRecipe, onBrowseRecipes, comeBack };
}

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** The recipe list's scroll view: the last one on screen, after the filter chips' row. */
const recipeList = () => shownOfType('RCTScrollView').at(-1)!;

/** The titles on the cards on screen, in order (a card may start with its status pill). */
const shownTitles = () => recipeCards().map((card) => shownText(card).find((text) => titles.includes(text)));
const chip = (name: string | RegExp) => screen.getByRole('button', { name });
const pressChip = (name: string | RegExp) => fireEvent.press(chip(name));
const search = (text: string) => fireEvent.changeText(screen.getByLabelText('Search bookmarks'), text);
const removeButton = (name: string) => screen.getByRole('button', { name: `Remove ${name} from bookmarks` });
const undoButton = (name: string) => screen.queryByRole('button', { name: `Undo removing ${name}` });

describe('BookmarksScreen', () => {
  describe('header', () => {
    it("has the board's title", async () => {
      await setup();
      expect(shownText()).toContain('Bookmarks');
    });

    it("has the board's handwritten line", async () => {
      await setup();
      expect(shownText()).toContain("what'chu lookin' for, fool?");
    });

    it("leaves room on the handwritten line's right so Android doesn't slice it", async () => {
      await setup();
      expect(styleOf(screen.getByText("what'chu lookin' for, fool?")).paddingRight).toBeGreaterThan(0);
    });

    it('counts the saved recipes and the ones ready to cook', async () => {
      await setup();
      expect(shownText()).toContain('4 saved recipes · 1 ready to cook');
    });
  });

  describe('loading', () => {
    it('shows a loading indicator while the bookmarks load', async () => {
      await setup({ listBookmarks: jest.fn(() => new Promise(() => {})) });
      expect(isLoading()).toBe(true);
    });

    it('says so when the bookmarks cannot load', async () => {
      await setup({ listBookmarks: jest.fn().mockRejectedValue(new Error('corrupt')) });
      expect(shownText()).toContain("Couldn't load your bookmarks.");
    });

    it('checks readiness for the saved recipes', async () => {
      const { checkRecipesReadiness } = await setup();
      expect(checkRecipesReadiness).toHaveBeenCalledWith([1, 2, 3, 4]);
    });

    it('shows the saved recipes while readiness is still being checked', async () => {
      await setup({ checkRecipesReadiness: jest.fn(() => new Promise(() => {})) });
      expect(shownTitles()).toEqual(titles);
    });
  });

  describe('the list', () => {
    it('shows saved recipes newest first', async () => {
      await setup();
      expect(shownTitles()).toEqual(['Garlic Pasta', 'Chicken Stir-Fry', 'Lemon Salmon', 'Beef Stew']);
    });

    it("shows each recipe's status and note", async () => {
      await setup();
      expect(shownText()).toEqual(expect.arrayContaining(['Swap available', '2/3 · swap tamari for soy sauce']));
    });

    it('opens a recipe when its card is tapped', async () => {
      const { onOpenRecipe } = await setup();
      await fireEvent.press(recipeCards()[1]);
      expect(onOpenRecipe).toHaveBeenCalledWith(2);
    });

    it('builds only the cards near the screen', async () => {
      await setup();
      const { initialNumToRender, maxToRenderPerBatch, windowSize } = recipeList().props;
      expect({ initialNumToRender, maxToRenderPerBatch, windowSize }).toEqual({ initialNumToRender: 8, maxToRenderPerBatch: 8, windowSize: 5 });
    });

    it('keeps the last card clear of the dock and the Undo bar', async () => {
      await setup({ bottomClearance: 110 });
      expect(StyleSheet.flatten(recipeList().props.contentContainerStyle).paddingBottom).toBe(170);
    });
  });

  describe('search', () => {
    it('keeps the recipes whose title matches', async () => {
      await setup();
      await search('stew');
      expect(shownTitles()).toEqual(['Beef Stew']);
    });

    it('brings the full list back from its clear button', async () => {
      await setup();
      await search('stew');
      await fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));
      expect(shownTitles()).toEqual(titles);
    });

    it('does not change the chip counts', async () => {
      await setup();
      await search('stew');
      expect(chip('All, 4')).toBeOnTheScreen();
    });

    it('says when nothing matches', async () => {
      await setup();
      await search('pizza');
      expect(shownText()).toEqual(expect.arrayContaining(['Nothing matches', 'Try a different filter or search.']));
    });
  });

  describe('filter chips', () => {
    it('counts the recipes under each chip', async () => {
      await setup();
      expect(['All, 4', 'Ready now, 1', 'Swap, 1', 'Almost there, 1'].map((name) => chip(name).props.accessibilityLabel)).toEqual([
        'All, 4',
        'Ready now, 1',
        'Swap, 1',
        'Almost there, 1',
      ]);
    });

    it('starts on All', async () => {
      await setup();
      expect(chip('All, 4').props.accessibilityState).toEqual({ selected: true });
    });

    it.each([
      ['Ready now, 1', 'Garlic Pasta'],
      ['Swap, 1', 'Chicken Stir-Fry'],
      ['Almost there, 1', 'Lemon Salmon'],
    ])('%s keeps only its recipes', async (name, title) => {
      await setup();
      await pressChip(name);
      expect(shownTitles()).toEqual([title]);
    });

    it('combines with the search', async () => {
      await setup();
      await pressChip('Ready now, 1');
      await search('stew');
      expect(shownText()).toContain('Nothing matches');
    });

    it('marks the chosen chip as selected', async () => {
      await setup();
      await pressChip('Swap, 1');
      expect(chip('Swap, 1').props.accessibilityState).toEqual({ selected: true });
    });

    it('shows a recipe needing three or more items under All only', async () => {
      await setup();
      expect(shownText()).toContain('3 items needed');
    });
  });

  describe('with no bookmarks', () => {
    const none = () => jest.fn().mockResolvedValue([]);

    it('explains how to add one', async () => {
      await setup({ listBookmarks: none(), checkRecipesReadiness: jest.fn().mockResolvedValue(new Map()) });
      expect(shownText()).toEqual(
        expect.arrayContaining(['No bookmarks yet', 'Tap the bookmark on any recipe to keep it here for later.']),
      );
    });

    it('opens the Recipes tab from Browse recipes', async () => {
      const { onBrowseRecipes } = await setup({ listBookmarks: none(), checkRecipesReadiness: jest.fn().mockResolvedValue(new Map()) });
      await fireEvent.press(screen.getByRole('button', { name: 'Browse recipes' }));
      expect(onBrowseRecipes).toHaveBeenCalledTimes(1);
    });
  });

  it('offers Browse recipes when nothing matches, too', async () => {
    await setup();
    await search('pizza');
    expect(screen.getByRole('button', { name: 'Browse recipes' })).toBeOnTheScreen();
  });

  describe('with an empty pantry', () => {
    const noPantry = () => jest.fn().mockResolvedValue(null);

    it('leaves the ready count out of the header', async () => {
      await setup({ checkRecipesReadiness: noPantry() });
      expect(shownText()).toContain('4 saved recipes');
    });

    it('hides the filter chips', async () => {
      await setup({ checkRecipesReadiness: noPantry() });
      expect(screen.queryByRole('button', { name: /^All, / })).toBeNull();
    });

    it('shows cards with only the title and time', async () => {
      await setup({ checkRecipesReadiness: noPantry() });
      expect(shownText(recipeCards()[0])).toEqual(['Garlic Pasta', '30 min']);
    });

    it('does not warn about the pantry', async () => {
      await setup({ checkRecipesReadiness: noPantry() });
      expect(shownText()).not.toContain("Couldn't check your pantry.");
    });

    it('goes back to All if the pantry empties while a filter is on', async () => {
      const checkRecipesReadiness = jest.fn().mockResolvedValue(allChecked);
      const { comeBack } = await setup({ checkRecipesReadiness });
      await pressChip('Swap, 1');
      checkRecipesReadiness.mockResolvedValue(null);
      await comeBack();
      expect(shownTitles()).toEqual(titles);
    });
  });

  describe("when the pantry can't be checked", () => {
    const failing = () => jest.fn().mockRejectedValue(new Error('corrupt'));

    it('says so', async () => {
      await setup({ checkRecipesReadiness: failing() });
      expect(shownText()).toContain("Couldn't check your pantry.");
    });

    it('still shows the saved recipes', async () => {
      await setup({ checkRecipesReadiness: failing() });
      expect(shownTitles()).toEqual(titles);
    });

    it('hides the filter chips', async () => {
      await setup({ checkRecipesReadiness: failing() });
      expect(screen.queryByRole('button', { name: /^All, / })).toBeNull();
    });
  });

  describe('coming back into view', () => {
    it('picks up a recipe saved on another screen', async () => {
      const listBookmarks = jest.fn().mockResolvedValue([pasta]);
      const { comeBack } = await setup({ listBookmarks });
      listBookmarks.mockResolvedValue([stew, pasta]);
      await comeBack();
      expect(shownTitles()).toEqual(['Beef Stew', 'Garlic Pasta']);
    });

    it('checks readiness again, so pantry changes show', async () => {
      const checkRecipesReadiness = jest.fn().mockResolvedValue(allChecked);
      const { comeBack } = await setup({ checkRecipesReadiness });
      checkRecipesReadiness.mockResolvedValue(new Map([[1, readiness('almost')]]));
      await comeBack();
      expect(chip('Ready now, 0')).toBeOnTheScreen();
    });

    it('keeps the list on screen while it reloads', async () => {
      const listBookmarks = jest.fn().mockResolvedValue(everything);
      const { comeBack } = await setup({ listBookmarks });
      listBookmarks.mockReturnValue(new Promise(() => {}));
      await comeBack();
      expect(shownTitles()).toEqual(titles);
    });

    it('keeps the list when the reload fails', async () => {
      const listBookmarks = jest.fn().mockResolvedValue(everything);
      const { comeBack } = await setup({ listBookmarks });
      listBookmarks.mockRejectedValue(new Error('corrupt'));
      await comeBack();
      expect(shownTitles()).toEqual(titles);
    });

    it('does not bring back a recipe removed while the reload was running', async () => {
      const listBookmarks = jest.fn().mockResolvedValue(everything);
      const { comeBack } = await setup({ listBookmarks });
      const reload = deferred<SavedRecipe[]>();
      listBookmarks.mockReturnValue(reload.promise);
      await comeBack();
      await fireEvent.press(removeButton('Garlic Pasta'));
      await act(async () => reload.resolve(everything));
      expect(shownTitles()).not.toContain('Garlic Pasta');
    });
  });

  describe('removing a bookmark', () => {
    beforeEach(() => jest.useFakeTimers());
    afterEach(() => jest.useRealTimers());

    const wait = (ms: number) =>
      act(async () => {
        jest.advanceTimersByTime(ms);
      });

    it('takes the recipe off the list', async () => {
      await setup();
      await fireEvent.press(removeButton('Garlic Pasta'));
      expect(shownTitles()).toEqual(['Chicken Stir-Fry', 'Lemon Salmon', 'Beef Stew']);
    });

    it('removes it from the saved bookmarks', async () => {
      const { removeBookmark } = await setup();
      await fireEvent.press(removeButton('Garlic Pasta'));
      expect(removeBookmark).toHaveBeenCalledWith(1);
    });

    it('updates the counts', async () => {
      await setup();
      await fireEvent.press(removeButton('Garlic Pasta'));
      expect(shownText()).toContain('3 saved recipes · 0 ready to cook');
    });

    it('says what was removed', async () => {
      await setup();
      await fireEvent.press(removeButton('Garlic Pasta'));
      expect(screen.getByRole('alert')).toHaveTextContent('Removed Garlic Pasta');
    });

    it('keeps the Undo bar just before 5 seconds', async () => {
      await setup();
      await fireEvent.press(removeButton('Garlic Pasta'));
      await wait(UNDO_BOOKMARK_MS - 1);
      expect(undoButton('Garlic Pasta')).toBeOnTheScreen();
    });

    it('hides the Undo bar after 5 seconds', async () => {
      await setup();
      await fireEvent.press(removeButton('Garlic Pasta'));
      await wait(UNDO_BOOKMARK_MS);
      expect(undoButton('Garlic Pasta')).toBeNull();
    });

    it('sits the Undo bar above the dock', async () => {
      await setup({ bottomClearance: 110 });
      await fireEvent.press(removeButton('Garlic Pasta'));
      expect(styleOf(screen.getByRole('alert').parent!).bottom).toBe(110);
    });

    it('offers Undo only for the latest removal', async () => {
      await setup();
      await fireEvent.press(removeButton('Garlic Pasta'));
      await fireEvent.press(removeButton('Beef Stew'));
      expect([undoButton('Garlic Pasta'), undoButton('Beef Stew')?.props.accessibilityLabel]).toEqual([null, 'Undo removing Beef Stew']);
    });

    it('gives a newer removal its own 5 seconds', async () => {
      await setup();
      await fireEvent.press(removeButton('Garlic Pasta'));
      await wait(UNDO_BOOKMARK_MS - 1);
      await fireEvent.press(removeButton('Beef Stew'));
      await wait(UNDO_BOOKMARK_MS - 1);
      expect(undoButton('Beef Stew')).toBeOnTheScreen();
    });

    describe('with Undo', () => {
      it('puts the recipe back in its old place', async () => {
        await setup();
        await fireEvent.press(removeButton('Chicken Stir-Fry'));
        await fireEvent.press(undoButton('Chicken Stir-Fry')!);
        expect(shownTitles()).toEqual(titles);
      });

      it('restores the bookmark with its saved order', async () => {
        const { restoreBookmark } = await setup();
        await fireEvent.press(removeButton('Chicken Stir-Fry'));
        await fireEvent.press(undoButton('Chicken Stir-Fry')!);
        expect(restoreBookmark).toHaveBeenCalledWith({ recipeId: 2, savedOrder: 8 });
      });

      it('hides the bar', async () => {
        await setup();
        await fireEvent.press(removeButton('Chicken Stir-Fry'));
        await fireEvent.press(undoButton('Chicken Stir-Fry')!);
        expect(screen.queryByRole('alert')).toBeNull();
      });
    });

    describe('when saving the change fails', () => {
      const broken = () => jest.fn().mockRejectedValue(new Error('full'));

      it('puts a recipe that could not be removed back', async () => {
        await setup({ removeBookmark: broken() });
        await fireEvent.press(removeButton('Garlic Pasta'));
        expect(shownTitles()).toEqual(titles);
      });

      it('says the removal failed instead of offering Undo', async () => {
        await setup({ removeBookmark: broken() });
        await fireEvent.press(removeButton('Garlic Pasta'));
        expect([screen.getByRole('alert').props.children, undoButton('Garlic Pasta')]).toEqual(["Couldn't update your bookmark.", null]);
      });

      it('takes the recipe off again when Undo could not be saved', async () => {
        await setup({ restoreBookmark: broken() });
        await fireEvent.press(removeButton('Garlic Pasta'));
        await fireEvent.press(undoButton('Garlic Pasta')!);
        expect(shownTitles()).not.toContain('Garlic Pasta');
      });

      it('clears the failure notice after a few seconds', async () => {
        await setup({ removeBookmark: broken() });
        await fireEvent.press(removeButton('Garlic Pasta'));
        await wait(BOOKMARK_NOTICE_MS);
        expect(screen.queryByRole('alert')).toBeNull();
      });
    });
  });

  it('shows no spinner once the list is there', async () => {
    await setup();
    expect(shownOfType('ActivityIndicator')).toHaveLength(0);
  });
});
