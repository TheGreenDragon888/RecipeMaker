import React from 'react';
import { act } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { DockBar } from '../../../src/ui/components/DockBar';
import { DockItem } from '../../../src/ui/components/DockItem';
import { indicatorOffset } from '../../../src/ui/motion/dockSwipe';
import { colors } from '../../../src/ui/theme';
import type { DockSurface } from '../../../src/ui/platform/dockSurface';
import { shownText, styleOf } from '../../support/screen';

// expo-blur's own view turns the blur target into a native id, so the test can't see which view it is.
// A plain stand-in shows exactly what DockBar hands to BlurView.
jest.mock('expo-blur', () => {
  const ReactInMock = require('react');
  const { View: ViewInMock } = require('react-native');
  return { BlurView: (props: object) => ReactInMock.createElement(ViewInMock, { ...props, testID: 'blur' }) };
});

const renderBar = (surface: DockSurface, blurTarget?: React.RefObject<React.ComponentRef<typeof View> | null>, bottom = 24) =>
  render(
    <DockBar surface={surface} bottom={bottom} blurTarget={blurTarget}>
      <Text>Pantry</Text>
      <Text>Recipes</Text>
    </DockBar>,
  );
// The dock is a container, not something a screen reader focuses, so RNTL's getByRole skips it.
const tabList = () => screen.container.queryAll((node) => node.props.accessibilityRole === 'tablist')[0];
const blur = () => screen.queryByTestId('blur');
/** The pill behind the current tab, which screen readers skip. */
const pill = () => screen.queryByTestId('dock-indicator', { includeHiddenElements: true });
const pillX = () => (styleOf(pill()!).transform as { translateX: number }[])[0].translateX;

/** A dock of three tabs, with the one at `focused` selected and the last one disabled, as in the app. */
const tabs = (focused: number | null) => [
  <DockItem key="p" label="Pantry" icon="pantry" isFocused={focused === 0} />,
  <DockItem key="r" label="Recipes" icon="recipes" isFocused={focused === 1} />,
  <DockItem key="b" label="Bookmarks" icon="bookmark" disabled />,
];
const dockOf = (focused: number | null, surface: DockSurface = 'translucent') => (
  <DockBar surface={surface} bottom={24}>
    {tabs(focused)}
  </DockBar>
);

describe('DockBar', () => {
  it('shows the tabs given to it', async () => {
    await renderBar('translucent');
    expect(shownText()).toEqual(['Pantry', 'Recipes']);
  });

  it('floats at the distance it is given from the bottom of the screen', async () => {
    await renderBar('translucent', undefined, 34);
    expect(styleOf(tabList()).bottom).toBe(34);
  });

  it('is a tab list for screen readers', async () => {
    await renderBar('translucent');
    expect(tabList()).toBeDefined();
  });

  describe('with a blur', () => {
    it('draws the tabs on a blur of whatever is behind the dock', async () => {
      await renderBar('blur');
      expect(blur()!.props.blurTarget).toBeUndefined();
    });
  });

  describe('with the Android blur', () => {
    it('blurs the given target view', async () => {
      const target = React.createRef<React.ComponentRef<typeof View>>();
      await renderBar('androidBlur', target);
      expect(blur()!.props.blurTarget).toBe(target);
    });

    it('uses the Android 12+ blur method', async () => {
      await renderBar('androidBlur', React.createRef<React.ComponentRef<typeof View>>());
      expect(blur()!.props.blurMethod).toBe('dimezisBlurViewSdk31Plus');
    });
  });

  describe('as a plain translucent bar', () => {
    it('does not blur', async () => {
      await renderBar('translucent');
      expect(blur()).not.toBeOnTheScreen();
    });

    it('fills with the see-through dock color', async () => {
      await renderBar('translucent');
      expect(styleOf(tabList()).backgroundColor).toBe(colors.dockSurface);
    });
  });

  describe('the pill behind the current tab', () => {
    it('sits under the first tab when it is selected', async () => {
      await render(dockOf(0));
      expect(pillX()).toBe(indicatorOffset(0));
    });

    it('sits under the second tab when it is selected', async () => {
      await render(dockOf(1));
      expect(pillX()).toBe(indicatorOffset(1));
    });

    it('is the accent-tinted pill from the board', async () => {
      await render(dockOf(0));
      expect(styleOf(pill()!).backgroundColor).toBe(colors.accentTint);
    });

    it.each<DockSurface>(['blur', 'androidBlur', 'translucent'])('is drawn on the %s dock', async (surface) => {
      await render(dockOf(1, surface));
      expect(pillX()).toBe(indicatorOffset(1));
    });

    it('is not drawn when no tab is selected', async () => {
      await render(dockOf(null));
      expect(pill()).toBeNull();
    });
  });

  describe('when another tab is selected', () => {
    const wait = (ms: number) => act(async () => { jest.advanceTimersByTime(ms); });

    beforeEach(() => {
      jest.useFakeTimers();
      // Unless a test says otherwise, the Reduce Motion setting never arrives, so the dock treats it as off.
      jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockReturnValue(new Promise<boolean>(() => {}));
    });
    afterEach(() => {
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    it('slides the pill part of the way there at first', async () => {
      await render(dockOf(0));
      await screen.rerender(dockOf(1));
      await wait(50);
      expect(pillX()).toBeGreaterThan(indicatorOffset(0));
      expect(pillX()).toBeLessThan(indicatorOffset(1));
    });

    it('ends with the pill under the newly selected tab', async () => {
      await render(dockOf(0));
      await screen.rerender(dockOf(1));
      await wait(1500);
      expect(pillX()).toBe(indicatorOffset(1));
    });

    it('moves the pill there at once with Reduce Motion on', async () => {
      jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
      await render(dockOf(0));
      await screen.rerender(dockOf(1));
      expect(pillX()).toBe(indicatorOffset(1));
    });
  });
});
