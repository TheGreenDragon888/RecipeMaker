import React from 'react';
import TestRenderer, { act, type ReactTestRenderer } from 'react-test-renderer';
import { router } from 'expo-router';
import type { RecipeServices } from '../../src/createRecipeServices';
import { RecipeServicesProvider } from '../../src/ui/RecipeServicesContext';
import { PantryScreen } from '../../src/ui/screens/PantryScreen';
import IndexRoute from '../../app/index';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));

const services = { suggestIngredients: jest.fn() } as unknown as RecipeServices;

async function renderRoute() {
  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(
      <RecipeServicesProvider start={() => Promise.resolve(services)}>
        <IndexRoute />
      </RecipeServicesProvider>,
    );
  });
  return renderer;
}

describe('index route', () => {
  it('renders the pantry screen with the started services', async () => {
    const renderer = await renderRoute();
    expect(renderer.root.findByType(PantryScreen).props.services).toBe(services);
  });

  it('opens the results route with the pantry list when recipes are requested', async () => {
    const renderer = await renderRoute();
    act(() => renderer.root.findByType(PantryScreen).props.onFindRecipes(['tomato', 'egg']));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/results', params: { pantry: '["tomato","egg"]' } });
  });
});
