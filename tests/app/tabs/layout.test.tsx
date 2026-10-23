import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { currentDockSurface } from '../../../src/ui/platform/dockSurface';
import TabsLayout from '../../../app/(tabs)/_layout';
import { shownText, styleOf } from '../../support/screen';

// Stand-ins for the headless tabs. Each tab trigger and the slot show up as a plain view that carries
// what the layout gave them, and their children render so the dock can be inspected.
jest.mock('expo-router/ui', () => {
  const { View } = jest.requireActual('react-native');
  return {
    Tabs: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
    TabSlot: () => <View testID="tab-slot" />,
    TabList: ({ children }: { children: React.ReactNode }) => children,
    TabTrigger: ({ children, name, href }: { children: React.ReactNode; name: string; href: string }) => (
      <View testID="tab-trigger" tabName={name} href={href}>
        {children}
      </View>
    ),
  };
});
// The blur view turns its target into a native id, and the target view hides which ref it got. These
// stand-ins show the ref each one was given, so the test can check the dock blurs the screens' view.
jest.mock('expo-blur', () => {
  const { View } = jest.requireActual('react-native');
  return {
    BlurTargetView: ({ children, ref, style }: { children: React.ReactNode; ref: unknown; style: unknown }) => (
      <View testID="blur-target" targetRef={ref} ref={ref} style={style}>
        {children}
      </View>
    ),
    BlurView: (props: object) => <View {...props} testID="blur" />,
  };
});
jest.mock('../../../src/ui/platform/dockSurface', () => ({ currentDockSurface: jest.fn() }));
// A phone with a 34 px home indicator.
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 47, right: 0, bottom: 34, left: 0 }),
}));

beforeEach(() => jest.mocked(currentDockSurface).mockReturnValue('androidBlur'));

const tabs = () => screen.getAllByRole('tab');
const bookmarks = () => screen.getByRole('tab', { name: 'Bookmarks, coming soon' });
const blurTarget = () => screen.getByTestId('blur-target');
const dock = () => screen.container.queryAll((node) => node.props.accessibilityRole === 'tablist')[0];

describe('tabs layout', () => {
  it('has a Pantry tab at "/" and a Recipes tab at "/recipes"', async () => {
    await render(<TabsLayout />);
    expect(screen.getAllByTestId('tab-trigger').map((t) => [t.props.tabName, t.props.href])).toEqual([
      ['index', '/'],
      ['recipes', '/recipes'],
    ]);
  });

  it('shows Pantry, Recipes and Bookmarks in the dock, in that order', async () => {
    await render(<TabsLayout />);
    expect(tabs().map((tab) => shownText(tab).join(''))).toEqual(['Pantry', 'Recipes', 'Bookmarks']);
  });

  it('shows Bookmarks as disabled', async () => {
    await render(<TabsLayout />);
    expect(bookmarks()).toBeDisabled();
  });

  it('tells screen readers Bookmarks is coming soon', async () => {
    await render(<TabsLayout />);
    expect(bookmarks()).toHaveAccessibleName('Bookmarks, coming soon');
  });

  it('draws the dock with the surface for this device', async () => {
    await render(<TabsLayout />);
    expect(screen.getByTestId('blur').props.blurMethod).toBe('dimezisBlurViewSdk31Plus');
  });

  it('lifts the dock to sit just above the home indicator', async () => {
    await render(<TabsLayout />);
    expect(styleOf(dock()).bottom).toBe(34);
  });

  it('shows the current tab inside the view the dock blurs', async () => {
    await render(<TabsLayout />);
    expect(blurTarget()).toContainElement(screen.getByTestId('tab-slot'));
  });

  it('keeps the dock out of the view it blurs, as the Android blur requires', async () => {
    await render(<TabsLayout />);
    expect(blurTarget()).not.toContainElement(dock());
  });

  it('points the dock at the view holding the screens', async () => {
    await render(<TabsLayout />);
    const dockTarget = screen.getByTestId('blur').props.blurTarget;
    // A mounted view, so the check below can't pass by comparing two empty refs.
    expect(dockTarget.current).toBeInstanceOf(Object);
    expect(dockTarget).toBe(blurTarget().props.targetRef);
  });
});
