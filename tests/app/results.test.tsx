import React from 'react';
import { act, render, screen } from '@testing-library/react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { RecipeServices } from '../../src/createRecipeServices';
import { RecipeServicesProvider } from '../../src/ui/RecipeServicesContext';
import { ResultsScreen } from '../../src/ui/screens/ResultsScreen';
import ResultsRoute from '../../app/results';
import { lastProps } from '../support/recordProps';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), dismissTo: jest.fn() },
  useLocalSearchParams: jest.fn(),
}));
jest.mock('../../src/ui/screens/ResultsScreen', () => {
  const { recordProps } = jest.requireActual('../support/recordProps');
  const actual = jest.requireActual('../../src/ui/screens/ResultsScreen');
  return { ResultsScreen: recordProps(actual.ResultsScreen) };
});

const findRecipesFromPantry = jest.fn().mockResolvedValue([]);
const services = { findRecipesFromPantry } as unknown as RecipeServices;

const routeElement = () => (
  <RecipeServicesProvider start={() => Promise.resolve(services)}>
    <ResultsRoute />
  </RecipeServicesProvider>
);

/** Renders the route as if the URL carried these search params. */
async function renderRoute(params: Record<string, string>) {
  (useLocalSearchParams as jest.Mock).mockReturnValue(params);
  await render(routeElement());
}

const screenProps = () => lastProps(ResultsScreen);

beforeEach(() => jest.clearAllMocks());

describe('results route', () => {
  it('renders the results screen with the started services', async () => {
    await renderRoute({ pantry: '["tomato"]' });
    expect(screenProps().services).toBe(services);
  });

  it('passes the pantry list from the route param', async () => {
    await renderRoute({ pantry: '["tomato","egg"]' });
    expect(screenProps().pantry).toEqual(['tomato', 'egg']);
  });

  it('passes an empty pantry list when the param is missing', async () => {
    await renderRoute({});
    expect(screenProps().pantry).toEqual([]);
  });

  it('searches only once when the route re-renders with the same param', async () => {
    await renderRoute({ pantry: '["tomato"]' });
    await screen.rerender(routeElement());
    expect(findRecipesFromPantry).toHaveBeenCalledTimes(1);
  });

  it('opens the recipe route for the chosen recipe', async () => {
    await renderRoute({ pantry: '["tomato"]' });
    await act(async () => screenProps().onOpenRecipe(42));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/recipe/[id]', params: { id: '42' } });
  });

  it('returns to the pantry route when the screen goes back', async () => {
    await renderRoute({ pantry: '["tomato"]' });
    await act(async () => screenProps().onBack());
    expect(router.dismissTo).toHaveBeenCalledWith('/');
  });
});
