// The Recipes tab redraws its screen every time the tab opens. Each card the list redraws then costs time, and
// redrawing all of them made switching to the tab lag (measured on the experiment/tab-lag branch). These tests
// count card draws through formatDuration, which every recipe card calls once per draw for its time line.
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { RecipeServices } from '../../../src/createRecipeServices';
import type { RecipeSummary } from '../../../src/domain/recipe';
import type { ReadinessStatus, RecipeReadiness } from '../../../src/domain/recipeReadiness';
import { formatDuration } from '../../../src/ui/format/recipeInfo';
import { RecipesScreen } from '../../../src/ui/screens/RecipesScreen';
import { recipeCards } from '../../support/screen';

jest.mock('../../../src/ui/format/recipeInfo', () => {
  const actual = jest.requireActual('../../../src/ui/format/recipeInfo');
  return { ...actual, formatDuration: jest.fn(actual.formatDuration) };
});

function makeSummary(id: number, name: string): RecipeSummary {
  return { id, name, totalTimeMinutes: 30, activeTimeMinutes: 15, servingsMin: 4, servingsMax: 4 };
}

const recipes = [makeSummary(1, 'Apple Pie'), makeSummary(2, 'Chili'), makeSummary(3, 'Potato Soup')];
const checkRecipesReadiness = jest.fn();
const services = {
  listAllRecipes: jest.fn().mockResolvedValue(recipes),
  searchRecipes: jest.fn(),
  filterRecipes: jest.fn().mockResolvedValue([]),
  listBookmarkIds: jest.fn().mockResolvedValue([]),
  addBookmark: jest.fn().mockResolvedValue(undefined),
  checkRecipesReadiness,
} as unknown as RecipeServices;
const onOpenRecipe = jest.fn();
const screenWith = (bottomClearance: number, refreshKey = 0) => (
  <RecipesScreen services={services} onOpenRecipe={onOpenRecipe} bottomClearance={bottomClearance} refreshKey={refreshKey} />
);
const settle = () => act(async () => {});

/** A fresh reply each time, as the real service gives: equal results, but new objects. */
const answerWith = (statusOf: (recipeId: number) => ReadinessStatus) => async (recipeIds: number[]) =>
  new Map(
    recipeIds.map((recipeId): [number, RecipeReadiness] => [
      recipeId,
      { status: statusOf(recipeId), onHandCount: 1, neededCount: 1, toBuy: [], swaps: [] },
    ]),
  );

beforeEach(() => {
  checkRecipesReadiness.mockReset();
  checkRecipesReadiness.mockResolvedValue(null);
});

describe('RecipesScreen card redraws', () => {
  it('draws each card once when the list first shows', async () => {
    await render(screenWith(110));
    expect(recipeCards()).toHaveLength(3);
    expect(formatDuration).toHaveBeenCalledTimes(3);
  });

  it('does not redraw the cards when the screen redraws with the same props', async () => {
    const { rerender } = await render(screenWith(110));
    jest.mocked(formatDuration).mockClear();
    await rerender(screenWith(110));
    expect(formatDuration).not.toHaveBeenCalled();
  });

  // The sheet keeps its choices to itself until it closes, so changing them doesn't touch the list behind it.
  it('does not redraw the cards while the Filters sheet is open and its choices change', async () => {
    jest.useFakeTimers();
    try {
      await render(screenWith(110));
      jest.mocked(formatDuration).mockClear();
      await fireEvent.press(screen.getByRole('button', { name: 'Filters' }));
      await fireEvent.press(screen.getByRole('switch', { name: 'Meal Prep' }));
      await act(async () => {
        jest.advanceTimersByTime(1000);
      });
      expect(formatDuration).not.toHaveBeenCalled();
    } finally {
      jest.useRealTimers();
    }
  });

  it('does not redraw the cards when a bookmark is tapped', async () => {
    await render(screenWith(110));
    jest.mocked(formatDuration).mockClear();
    await fireEvent.press(screen.getByRole('button', { name: 'Save Chili' }));
    expect(formatDuration).not.toHaveBeenCalled();
  });

  it('does not redraw the cards when it comes back into view with the same bookmarks', async () => {
    const { rerender } = await render(screenWith(110));
    jest.mocked(formatDuration).mockClear();
    await rerender(screenWith(110, 1));
    expect(formatDuration).not.toHaveBeenCalled();
  });

  it('does not redraw the cards when it comes back into view with the same readiness', async () => {
    checkRecipesReadiness.mockImplementation(answerWith(() => 'ready'));
    const { rerender } = await render(screenWith(110));
    await settle();
    jest.mocked(formatDuration).mockClear();
    await rerender(screenWith(110, 1));
    await settle();
    expect(formatDuration).not.toHaveBeenCalled();
  });

  it('redraws only the card whose readiness changed', async () => {
    checkRecipesReadiness.mockImplementation(answerWith(() => 'almost'));
    const { rerender } = await render(screenWith(110));
    await settle();
    jest.mocked(formatDuration).mockClear();
    checkRecipesReadiness.mockImplementation(answerWith((recipeId) => (recipeId === 2 ? 'ready' : 'almost')));
    await rerender(screenWith(110, 1));
    await settle();
    expect(formatDuration).toHaveBeenCalledTimes(1);
  });
});
