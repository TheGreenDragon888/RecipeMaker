import React from 'react';
import { act, render } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { RecipeServices } from '../../../src/createRecipeServices';
import { RecipeServicesProvider } from '../../../src/ui/RecipeServicesContext';
import { RecipesScreen } from '../../../src/ui/screens/RecipesScreen';
import RecipesRoute from '../../../app/(tabs)/recipes';
import { lastProps } from '../../support/recordProps';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
// A phone with a 34 px home indicator.
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 47, right: 0, bottom: 34, left: 0 }),
}));
jest.mock('../../../src/ui/screens/RecipesScreen', () => {
  const { recordProps } = jest.requireActual('../../support/recordProps');
  const actual = jest.requireActual('../../../src/ui/screens/RecipesScreen');
  return { RecipesScreen: recordProps(actual.RecipesScreen) };
});

const services = { listAllRecipes: jest.fn().mockResolvedValue([]) } as unknown as RecipeServices;

const renderRoute = () =>
  render(
    <RecipeServicesProvider start={() => Promise.resolve(services)}>
      <RecipesRoute />
    </RecipeServicesProvider>,
  );

const screenProps = () => lastProps(RecipesScreen);

describe('recipes route', () => {
  it('leaves room for the dock above the home indicator', async () => {
    await renderRoute();
    expect(screenProps().bottomClearance).toBe(110);
  });

  it('renders the recipes screen with the started services', async () => {
    await renderRoute();
    expect(screenProps().services).toBe(services);
  });

  it('opens the recipe detail route when a recipe is chosen', async () => {
    await renderRoute();
    await act(async () => screenProps().onOpenRecipe(42));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/recipe/[id]', params: { id: '42' } });
  });
});
