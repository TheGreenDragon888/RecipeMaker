// Tests app/recipe/[id].tsx (the file name leaves out the brackets, which Jest path patterns treat as special).
import React from 'react';
import { act, render } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { RecipeServices } from '../../../src/createRecipeServices';
import { RecipeServicesProvider } from '../../../src/ui/RecipeServicesContext';
import { RecipeDetailScreen } from '../../../src/ui/screens/RecipeDetailScreen';
import RecipeRoute from '../../../app/recipe/[id]';
import { lastProps } from '../../support/recordProps';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), dismissTo: jest.fn() },
  useLocalSearchParams: jest.fn(),
}));
jest.mock('../../../src/ui/screens/RecipeDetailScreen', () => {
  const { recordProps } = jest.requireActual('../../support/recordProps');
  const actual = jest.requireActual('../../../src/ui/screens/RecipeDetailScreen');
  return { RecipeDetailScreen: recordProps(actual.RecipeDetailScreen) };
});

const services = {
  getRecipeDetail: jest.fn(() => new Promise(() => {})),
  getSimilarRecipes: jest.fn().mockResolvedValue([]),
  checkRecipeAgainstPantry: jest.fn().mockResolvedValue(null),
} as unknown as RecipeServices;

/** Renders the route as if the URL were /recipe/<id>. */
async function renderRoute(params: Record<string, string>) {
  (useLocalSearchParams as jest.Mock).mockReturnValue(params);
  await render(
    <RecipeServicesProvider start={() => Promise.resolve(services)}>
      <RecipeRoute />
    </RecipeServicesProvider>,
  );
}

const screenProps = () => lastProps(RecipeDetailScreen);

beforeEach(() => jest.clearAllMocks());

describe('recipe route', () => {
  it('renders the recipe detail screen with the started services', async () => {
    await renderRoute({ id: '42' });
    expect(screenProps().services).toBe(services);
  });

  it('passes the recipe id from the URL as a number', async () => {
    await renderRoute({ id: '42' });
    expect(screenProps().recipeId).toBe(42);
  });

  it('passes no recipe id when the URL id is not a number', async () => {
    await renderRoute({ id: 'tacos' });
    expect(screenProps().recipeId).toBeNull();
  });

  it('opens another recipe on top of this one', async () => {
    await renderRoute({ id: '42' });
    await act(async () => screenProps().onOpenRecipe(8));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/recipe/[id]', params: { id: '8' } });
  });

  it('goes back to the previous screen', async () => {
    await renderRoute({ id: '42' });
    await act(async () => screenProps().onBack());
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('returns to the pantry route', async () => {
    await renderRoute({ id: '42' });
    await act(async () => screenProps().onReturnToPantry());
    expect(router.dismissTo).toHaveBeenCalledWith('/');
  });
});
