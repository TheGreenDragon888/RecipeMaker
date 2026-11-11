// The Recipes tab redraws its screen every time the tab opens. Each card the list redraws then costs time, and
// redrawing all of them made switching to the tab lag (measured on the experiment/tab-lag branch). These tests
// count card draws through formatDuration, which every recipe card calls once per draw for its time line.
import React from 'react';
import { render } from '@testing-library/react-native';
import type { RecipeServices } from '../../../src/createRecipeServices';
import type { RecipeSummary } from '../../../src/domain/recipe';
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
const services = { listAllRecipes: jest.fn().mockResolvedValue(recipes), searchRecipes: jest.fn() } as unknown as RecipeServices;
const onOpenRecipe = jest.fn();
const screenWith = (bottomClearance: number) => (
  <RecipesScreen services={services} onOpenRecipe={onOpenRecipe} bottomClearance={bottomClearance} />
);

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
});
