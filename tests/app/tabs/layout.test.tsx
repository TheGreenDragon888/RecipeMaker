import React from 'react';
import { View } from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { TabSlot, TabTrigger } from 'expo-router/ui';
import { DockBar } from '../../../src/ui/components/DockBar';
import { DockItem } from '../../../src/ui/components/DockItem';
import { currentDockSurface } from '../../../src/ui/platform/dockSurface';
import { render } from '../../support/render';
import TabsLayout from '../../../app/(tabs)/_layout';

// Stand-ins for the headless tabs: each renders its children so the dock can be inspected.
jest.mock('expo-router/ui', () => {
  const { View } = jest.requireActual('react-native');
  return {
    Tabs: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    TabSlot: () => null,
    TabList: ({ children }: { children: React.ReactNode }) => children,
    TabTrigger: ({ children }: { children: React.ReactNode }) => children,
  };
});
jest.mock('../../../src/ui/platform/dockSurface', () => ({ currentDockSurface: jest.fn() }));
// A phone with a 34 px home indicator.
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 47, right: 0, bottom: 34, left: 0 }),
}));

beforeEach(() => jest.mocked(currentDockSurface).mockReturnValue('androidBlur'));

const triggers = () =>
  render(<TabsLayout />).root.findAllByType(TabTrigger).map((t) => [t.props.name, t.props.href]);
const bookmarks = () => render(<TabsLayout />).root.findAllByType(DockItem).find((i) => i.props.label === 'Bookmarks');

describe('tabs layout', () => {
  it('has a Pantry tab at "/" and a Recipes tab at "/recipes"', () => {
    expect(triggers()).toEqual([
      ['index', '/'],
      ['recipes', '/recipes'],
    ]);
  });

  it('shows Pantry, Recipes and Bookmarks in the dock, in that order', () => {
    const labels = render(<TabsLayout />).root.findAllByType(DockItem).map((i) => i.props.label);
    expect(labels).toEqual(['Pantry', 'Recipes', 'Bookmarks']);
  });

  it('shows Bookmarks as disabled', () => {
    expect(bookmarks()?.props.disabled).toBe(true);
  });

  it('tells screen readers Bookmarks is coming soon', () => {
    expect(bookmarks()?.props.accessibilityLabel).toBe('Bookmarks, coming soon');
  });

  it('draws the dock with the surface for this device', () => {
    expect(render(<TabsLayout />).root.findByType(DockBar).props.surface).toBe('androidBlur');
  });

  it('lifts the dock to sit just above the home indicator', () => {
    expect(render(<TabsLayout />).root.findByType(DockBar).props.bottom).toBe(34);
  });

  it('shows the current tab inside the view the dock blurs', () => {
    const target = render(<TabsLayout />).root.findByType(BlurTargetView);
    expect(target.findAllByType(TabSlot)).toHaveLength(1);
  });

  it('keeps the dock out of the view it blurs, as the Android blur requires', () => {
    const target = render(<TabsLayout />).root.findByType(BlurTargetView);
    expect(target.findAllByType(DockBar)).toHaveLength(0);
  });

  it('points the dock at the view holding the screens', () => {
    const layout = render(<TabsLayout />).root;
    const blurTarget = layout.findByType(DockBar).props.blurTarget;
    // A mounted view, so the check below can't pass by comparing two nulls.
    expect(blurTarget.current).toBeInstanceOf(Object);
    expect(blurTarget.current).toBe(layout.findByType(BlurTargetView).findByType(View).instance);
  });
});
