import React from 'react';
import { act, render } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { RecipeServices } from '../../../src/createRecipeServices';
import { RecipeServicesProvider } from '../../../src/ui/RecipeServicesContext';
import { PantryScreen } from '../../../src/ui/screens/PantryScreen';
import IndexRoute from '../../../app/(tabs)/index';
import { lastProps } from '../../support/recordProps';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
// A phone with a 34 px home indicator.
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 47, right: 0, bottom: 34, left: 0 }),
}));
jest.mock('../../../src/ui/screens/PantryScreen', () => {
  const { recordProps } = jest.requireActual('../../support/recordProps');
  const actual = jest.requireActual('../../../src/ui/screens/PantryScreen');
  return { PantryScreen: recordProps(actual.PantryScreen) };
});

const services = {
  suggestIngredients: jest.fn(),
  getPantryCatalog: jest.fn().mockResolvedValue({ units: {}, seasoningGroups: [] }),
} as unknown as RecipeServices;

const renderRoute = () =>
  render(
    <RecipeServicesProvider start={() => Promise.resolve(services)}>
      <IndexRoute />
    </RecipeServicesProvider>,
  );

const screenProps = () => lastProps(PantryScreen);

describe('index route', () => {
  it('leaves room for the dock above the home indicator', async () => {
    await renderRoute();
    expect(screenProps().bottomClearance).toBe(110);
  });

  it('passes the bottom inset, so the amount sheet can rise above the keyboard', async () => {
    await renderRoute();
    expect(screenProps().bottomInset).toBe(34);
  });

  it('renders the pantry screen with the started services', async () => {
    await renderRoute();
    expect(screenProps().services).toBe(services);
  });

  it('opens the results route with the pantry list when recipes are requested', async () => {
    await renderRoute();
    await act(async () => screenProps().onFindRecipes(['tomato', 'egg']));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/results', params: { pantry: '["tomato","egg"]' } });
  });
});
