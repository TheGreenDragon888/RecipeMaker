// Tests app/recipe/[id].tsx (the file name leaves out the brackets, which Jest path patterns treat as special).
import React from 'react';
import TestRenderer, { act, type ReactTestRenderer } from 'react-test-renderer';
import { router, useLocalSearchParams } from 'expo-router';
import type { RecipeServices } from '../../../src/createRecipeServices';
import { RecipeServicesProvider } from '../../../src/ui/RecipeServicesContext';
import { RecipeDetailScreen } from '../../../src/ui/screens/RecipeDetailScreen';
import RecipeRoute from '../../../app/recipe/[id]';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), dismissTo: jest.fn() },
  useLocalSearchParams: jest.fn(),
}));

const services = {
  getRecipeDetail: jest.fn(() => new Promise(() => {})),
  getSimilarRecipes: jest.fn().mockResolvedValue([]),
} as unknown as RecipeServices;

/** Renders the route as if the URL were /recipe/<id>. */
async function renderRoute(params: Record<string, string>) {
  (useLocalSearchParams as jest.Mock).mockReturnValue(params);
  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(
      <RecipeServicesProvider start={() => Promise.resolve(services)}>
        <RecipeRoute />
      </RecipeServicesProvider>,
    );
  });
  return renderer;
}

const screen = (renderer: ReactTestRenderer) => renderer.root.findByType(RecipeDetailScreen);

beforeEach(() => jest.clearAllMocks());

describe('recipe route', () => {
  it('renders the recipe detail screen with the started services', async () => {
    const renderer = await renderRoute({ id: '42' });
    expect(screen(renderer).props.services).toBe(services);
  });

  it('passes the recipe id from the URL as a number', async () => {
    const renderer = await renderRoute({ id: '42' });
    expect(screen(renderer).props.recipeId).toBe(42);
  });

  it('passes no recipe id when the URL id is not a number', async () => {
    const renderer = await renderRoute({ id: 'tacos' });
    expect(screen(renderer).props.recipeId).toBeNull();
  });

  it('opens another recipe on top of this one', async () => {
    const renderer = await renderRoute({ id: '42' });
    act(() => screen(renderer).props.onOpenRecipe(8));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/recipe/[id]', params: { id: '8' } });
  });

  it('goes back to the previous screen', async () => {
    const renderer = await renderRoute({ id: '42' });
    act(() => screen(renderer).props.onBack());
    expect(router.back).toHaveBeenCalledTimes(1);
  });

  it('returns to the pantry route', async () => {
    const renderer = await renderRoute({ id: '42' });
    act(() => screen(renderer).props.onReturnToPantry());
    expect(router.dismissTo).toHaveBeenCalledWith('/');
  });
});
