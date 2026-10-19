import React from 'react';
import TestRenderer, { act, type ReactTestRenderer } from 'react-test-renderer';
import { router } from 'expo-router';
import type { RecipeServices } from '../../../src/createRecipeServices';
import { RecipeServicesProvider } from '../../../src/ui/RecipeServicesContext';
import { RecipesScreen } from '../../../src/ui/screens/RecipesScreen';
import RecipesRoute from '../../../app/(tabs)/recipes';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
// A phone with a 34 px home indicator.
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 47, right: 0, bottom: 34, left: 0 }),
}));

const services = { listAllRecipes: jest.fn().mockResolvedValue([]) } as unknown as RecipeServices;

async function renderRoute() {
  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(
      <RecipeServicesProvider start={() => Promise.resolve(services)}>
        <RecipesRoute />
      </RecipeServicesProvider>,
    );
  });
  return renderer;
}

describe('recipes route', () => {
  it('leaves room for the dock above the home indicator', async () => {
    const renderer = await renderRoute();
    expect(renderer.root.findByType(RecipesScreen).props.bottomClearance).toBe(110);
  });

  it('renders the recipes screen with the started services', async () => {
    const renderer = await renderRoute();
    expect(renderer.root.findByType(RecipesScreen).props.services).toBe(services);
  });

  it('opens the recipe detail route when a recipe is chosen', async () => {
    const renderer = await renderRoute();
    act(() => renderer.root.findByType(RecipesScreen).props.onOpenRecipe(42));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/recipe/[id]', params: { id: '42' } });
  });
});
