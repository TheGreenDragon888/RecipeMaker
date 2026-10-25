import React from 'react';
import { act, render } from '@testing-library/react-native';
import { router } from 'expo-router';
import type { RecipeServices } from '../../../src/createRecipeServices';
import { RecipeServicesProvider } from '../../../src/ui/RecipeServicesContext';
import { RecipesScreen } from '../../../src/ui/screens/RecipesScreen';
import RecipesRoute from '../../../app/(tabs)/recipes';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { currentTabBar } from '../../../src/ui/platform/tabBar';
import { lastProps } from '../../support/recordProps';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: jest.fn() }));
jest.mock('../../../src/ui/platform/tabBar', () => ({ currentTabBar: jest.fn() }));
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

/** The insets inside a tab: a 34 px home indicator, plus the 49 pt bar on iOS (measured in Expo Go). */
const onAndroid = () => {
  jest.mocked(currentTabBar).mockReturnValue('dock');
  jest.mocked(useSafeAreaInsets).mockReturnValue({ top: 47, right: 0, bottom: 34, left: 0 });
};
const onIOS = () => {
  jest.mocked(currentTabBar).mockReturnValue('native');
  jest.mocked(useSafeAreaInsets).mockReturnValue({ top: 0, right: 0, bottom: 83, left: 0 });
};

beforeEach(onAndroid);

describe('recipes route', () => {
  it('leaves room for the dock above the home indicator on Android', async () => {
    await renderRoute();
    expect(screenProps().bottomClearance).toBe(110);
  });

  it("leaves room for iOS's tab bar and the board's 24 px gap above it", async () => {
    onIOS();
    await renderRoute();
    expect(screenProps().bottomClearance).toBe(83 + 24);
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
