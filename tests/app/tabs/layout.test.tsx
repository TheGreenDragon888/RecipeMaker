import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { currentDockSurface } from '../../../src/ui/platform/dockSurface';
import { currentTabBar } from '../../../src/ui/platform/tabBar';
import { colors, fonts } from '../../../src/ui/theme';
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
// Stand-ins for iOS's native tabs. The real ones draw nothing in React Native (the system draws the bar), so
// each piece shows up as a plain view carrying its props, with the labels as text.
jest.mock('expo-router/native-tabs', () => {
  const { Text, View } = jest.requireActual('react-native');
  const Trigger = ({ children, ...props }: { children: React.ReactNode }) => (
    <View testID="native-tab" {...props}>
      {children}
    </View>
  );
  Trigger.Label = ({ children }: { children: React.ReactNode }) => <Text>{children}</Text>;
  Trigger.Icon = (props: object) => <View testID="native-tab-icon" {...props} />;
  const NativeTabs = ({ children, ...props }: { children: React.ReactNode }) => (
    <View testID="native-tabs" {...props}>
      {children}
    </View>
  );
  NativeTabs.Trigger = Trigger;
  return { NativeTabs };
});
jest.mock('../../../src/ui/platform/dockSurface', () => ({ currentDockSurface: jest.fn() }));
jest.mock('../../../src/ui/platform/tabBar', () => ({ currentTabBar: jest.fn() }));
// A phone with a 34 px home indicator.
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 47, right: 0, bottom: 34, left: 0 }),
}));

beforeEach(() => jest.mocked(currentDockSurface).mockReturnValue('androidBlur'));

const tabs = () => screen.getAllByRole('tab');
const bookmarks = () => screen.getByRole('tab', { name: 'Bookmarks, coming soon' });
const blurTarget = () => screen.getByTestId('blur-target');
const dock = () => screen.container.queryAll((node) => node.props.accessibilityRole === 'tablist')[0];

describe('tabs layout on Android (the floating dock)', () => {
  beforeEach(() => jest.mocked(currentTabBar).mockReturnValue('dock'));

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

describe("tabs layout on iOS (the system's tab bar)", () => {
  beforeEach(() => jest.mocked(currentTabBar).mockReturnValue('native'));

  const nativeTabs = () => screen.getByTestId('native-tabs');
  const nativeTabList = () => screen.getAllByTestId('native-tab');

  it('draws no dock', async () => {
    await render(<TabsLayout />);
    expect(dock()).toBeUndefined();
  });

  it('draws no blur target, since iOS draws its own bar', async () => {
    await render(<TabsLayout />);
    expect(screen.queryByTestId('blur-target')).toBeNull();
  });

  it('has a Pantry tab at "index" and a Recipes tab at "recipes", in that order', async () => {
    await render(<TabsLayout />);
    expect(nativeTabList().map((tab) => tab.props.name)).toEqual(['index', 'recipes']);
  });

  it('labels the tabs Pantry and Recipes', async () => {
    await render(<TabsLayout />);
    expect(nativeTabList().map((tab) => shownText(tab).join(''))).toEqual(['Pantry', 'Recipes']);
  });

  it('shows SF Symbols that fill in when their tab is selected', async () => {
    await render(<TabsLayout />);
    expect(screen.getAllByTestId('native-tab-icon').map((icon) => icon.props.sf)).toEqual([
      { default: 'cabinet', selected: 'cabinet.fill' },
      { default: 'book', selected: 'book.fill' },
    ]);
  });

  it('tints the selected tab with the accent color', async () => {
    await render(<TabsLayout />);
    expect(nativeTabs().props.tintColor).toBe(colors.accent);
  });

  it('writes the tab labels in Nunito Sans', async () => {
    await render(<TabsLayout />);
    expect(nativeTabs().props.labelStyle).toEqual({ fontFamily: fonts.semibold });
  });

  it('shrinks the tab bar while the user scrolls down', async () => {
    await render(<TabsLayout />);
    expect(nativeTabs().props.minimizeBehavior).toBe('onScrollDown');
  });
});
