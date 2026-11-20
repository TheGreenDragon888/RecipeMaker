import React from 'react';
import { act, render } from '@testing-library/react-native';
import { router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RecipeServices } from '../../../src/createRecipeServices';
import { RecipeServicesProvider } from '../../../src/ui/RecipeServicesContext';
import { BookmarksScreen } from '../../../src/ui/screens/BookmarksScreen';
import BookmarksRoute from '../../../app/(tabs)/bookmarks';
import { lastProps } from '../../support/recordProps';

jest.mock('expo-router', () => ({ router: { push: jest.fn(), navigate: jest.fn() }, useFocusEffect: jest.fn() }));
jest.mock('react-native-safe-area-context', () => ({ useSafeAreaInsets: jest.fn() }));
jest.mock('../../../src/ui/screens/BookmarksScreen', () => {
  const { recordProps } = jest.requireActual('../../support/recordProps');
  const actual = jest.requireActual('../../../src/ui/screens/BookmarksScreen');
  return { BookmarksScreen: recordProps(actual.BookmarksScreen) };
});

const services = {
  listBookmarks: jest.fn().mockResolvedValue([]),
  checkRecipesReadiness: jest.fn().mockResolvedValue(null),
} as unknown as RecipeServices;

const renderRoute = () =>
  render(
    <RecipeServicesProvider start={() => Promise.resolve(services)}>
      <BookmarksRoute />
    </RecipeServicesProvider>,
  );

const screenProps = () => lastProps(BookmarksScreen);

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useSafeAreaInsets).mockReturnValue({ top: 47, right: 0, bottom: 34, left: 0 });
});

describe('bookmarks route', () => {
  it('renders the bookmarks screen with the started services', async () => {
    await renderRoute();
    expect(screenProps().services).toBe(services);
  });

  it('leaves room for the dock above the home indicator', async () => {
    await renderRoute();
    expect(screenProps().bottomClearance).toBe(110);
  });

  it('opens the recipe detail route when a recipe is chosen', async () => {
    await renderRoute();
    await act(async () => screenProps().onOpenRecipe(42));
    expect(router.push).toHaveBeenCalledWith({ pathname: '/recipe/[id]', params: { id: '42' } });
  });

  it('switches to the Recipes tab from Browse recipes', async () => {
    await renderRoute();
    await act(async () => screenProps().onBrowseRecipes());
    expect(router.navigate).toHaveBeenCalledWith('/recipes');
  });

  it('tells the screen when the tab comes back into view', async () => {
    await renderRoute();
    const focus = () => act(async () => jest.mocked(useFocusEffect).mock.lastCall![0]());
    await focus();
    await focus();
    expect(screenProps().refreshKey).toBe(1);
  });
});
