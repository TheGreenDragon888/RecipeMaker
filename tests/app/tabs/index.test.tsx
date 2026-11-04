import React from 'react';
import { Platform } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { RecipeServices } from '../../../src/createRecipeServices';
import { RecipeServicesProvider } from '../../../src/ui/RecipeServicesContext';
import { PantryScreen } from '../../../src/ui/screens/PantryScreen';
import IndexRoute from '../../../app/(tabs)/index';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lastProps } from '../../support/recordProps';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: jest.fn() }));
jest.mock('../../../src/ui/screens/PantryScreen', () => {
  const { recordProps } = jest.requireActual('../../support/recordProps');
  const actual = jest.requireActual('../../../src/ui/screens/PantryScreen');
  return { PantryScreen: recordProps(actual.PantryScreen) };
});

const services = {
  suggestIngredients: jest.fn(),
  getPantryCatalog: jest.fn().mockResolvedValue({ units: {}, seasoningGroups: [] }),
  loadSavedPantry: jest.fn().mockResolvedValue({ pantry: [], seasoningsOn: [], changes: [] }),
  savePantry: jest.fn().mockResolvedValue(undefined),
} as unknown as RecipeServices;

const renderRoute = () =>
  render(
    <RecipeServicesProvider start={() => Promise.resolve(services)}>
      <IndexRoute />
    </RecipeServicesProvider>,
  );

const screenProps = () => lastProps(PantryScreen);

/** The insets inside a tab: a 34 px home indicator, on both platforms. */
const onAndroid = () => {
  jest.replaceProperty(Platform, 'OS', 'android');
  jest.mocked(useSafeAreaInsets).mockReturnValue({ top: 47, right: 0, bottom: 34, left: 0 });
};
const onIOS = () => {
  jest.replaceProperty(Platform, 'OS', 'ios');
  jest.mocked(useSafeAreaInsets).mockReturnValue({ top: 47, right: 0, bottom: 34, left: 0 });
};

beforeEach(onAndroid);

describe('index route', () => {
  it('leaves room for the dock above the home indicator on Android', async () => {
    await renderRoute();
    expect(screenProps().bottomClearance).toBe(110);
  });

  it('leaves room for the dock above the home indicator on iOS', async () => {
    onIOS();
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
