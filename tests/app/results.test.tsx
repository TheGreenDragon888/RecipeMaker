import React from 'react';
import TestRenderer, { act, type ReactTestRenderer } from 'react-test-renderer';
import { router, useLocalSearchParams } from 'expo-router';
import type { RecipeServices } from '../../src/createRecipeServices';
import { RecipeServicesProvider } from '../../src/ui/RecipeServicesContext';
import { ResultsScreen } from '../../src/ui/screens/ResultsScreen';
import ResultsRoute from '../../app/results';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), dismissTo: jest.fn() },
  useLocalSearchParams: jest.fn(),
}));

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
  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(routeElement());
  });
  return renderer;
}

const screen = (renderer: ReactTestRenderer) => renderer.root.findByType(ResultsScreen);

beforeEach(() => jest.clearAllMocks());

describe('results route', () => {
  it('renders the results screen with the started services', async () => {
    const renderer = await renderRoute({ pantry: '["tomato"]' });
    expect(screen(renderer).props.services).toBe(services);
  });

  it('passes the pantry list from the route param', async () => {
    const renderer = await renderRoute({ pantry: '["tomato","egg"]' });
    expect(screen(renderer).props.pantry).toEqual(['tomato', 'egg']);
  });

  it('passes an empty pantry list when the param is missing', async () => {
    const renderer = await renderRoute({});
    expect(screen(renderer).props.pantry).toEqual([]);
  });

  it('searches only once when the route re-renders with the same param', async () => {
    const renderer = await renderRoute({ pantry: '["tomato"]' });
    await act(async () => renderer.update(routeElement()));
    expect(findRecipesFromPantry).toHaveBeenCalledTimes(1);
  });

  it('opens the recipe route for the chosen recipe', async () => {
    const renderer = await renderRoute({ pantry: '["tomato"]' });
    act(() => screen(renderer).props.onOpenRecipe(42));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/recipe/[id]', params: { id: '42' } });
  });

  it('returns to the pantry route when the screen goes back', async () => {
    const renderer = await renderRoute({ pantry: '["tomato"]' });
    act(() => screen(renderer).props.onBack());
    expect(router.dismissTo).toHaveBeenCalledWith('/');
  });
});
