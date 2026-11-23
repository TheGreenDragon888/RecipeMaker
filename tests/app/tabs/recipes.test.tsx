import React from 'react';
import { Platform } from 'react-native';
import { act, render } from '@testing-library/react-native';
import { router, useFocusEffect } from 'expo-router';
import type { RecipeServices } from '../../../src/createRecipeServices';
import { DockVisibilityProvider } from '../../../src/ui/DockVisibilityContext';
import { RecipeServicesProvider } from '../../../src/ui/RecipeServicesContext';
import { RecipesScreen } from '../../../src/ui/screens/RecipesScreen';
import RecipesRoute from '../../../app/(tabs)/recipes';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lastProps } from '../../support/recordProps';

jest.mock('expo-router', () => ({ router: { push: jest.fn() }, useFocusEffect: jest.fn() }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: jest.fn() }));
jest.mock('../../../src/ui/screens/RecipesScreen', () => {
  const { recordProps } = jest.requireActual('../../support/recordProps');
  const actual = jest.requireActual('../../../src/ui/screens/RecipesScreen');
  return { RecipesScreen: recordProps(actual.RecipesScreen) };
});

const services = {
  listAllRecipes: jest.fn().mockResolvedValue([]),
  listBookmarkIds: jest.fn().mockResolvedValue([]),
} as unknown as RecipeServices;

const onSheetShownChange = jest.fn();
const routeElement = () => (
  <DockVisibilityProvider onSheetShownChange={onSheetShownChange}>
    <RecipeServicesProvider start={() => Promise.resolve(services)}>
      <RecipesRoute />
    </RecipeServicesProvider>
  </DockVisibilityProvider>
);
const renderRoute = () => render(routeElement());

const screenProps = () => lastProps(RecipesScreen);

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

describe('recipes route', () => {
  it('leaves room for the dock above the home indicator on Android', async () => {
    await renderRoute();
    expect(screenProps().bottomClearance).toBe(110);
  });

  it('leaves room for the dock above the home indicator on iOS', async () => {
    onIOS();
    await renderRoute();
    expect(screenProps().bottomClearance).toBe(110);
  });

  it('passes the bottom inset, so the filters sheet can stand on the screen\'s bottom edge', async () => {
    await renderRoute();
    expect(screenProps().bottomInset).toBe(34);
  });

  it('tells the tabs layout when the filters sheet shows, so the dock moves out of its way', async () => {
    await renderRoute();
    await act(async () => screenProps().onSheetShownChange?.(true));
    expect(onSheetShownChange).toHaveBeenLastCalledWith(true);
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

  it('tells the screen when the tab comes back into view', async () => {
    await renderRoute();
    const focus = () => act(async () => jest.mocked(useFocusEffect).mock.lastCall![0]());
    await focus();
    await focus();
    expect(screenProps().refreshKey).toBe(1);
  });

  // The tabs redraw this route on every switch; a new function each time would make the list redraw its cards too.
  it('hands the screen the same onOpenRecipe when it redraws', async () => {
    const { rerender } = await renderRoute();
    const first = screenProps().onOpenRecipe;
    await rerender(routeElement());
    expect(jest.mocked(RecipesScreen).mock.calls.length).toBeGreaterThan(1);
    expect(screenProps().onOpenRecipe).toBe(first);
  });
});
