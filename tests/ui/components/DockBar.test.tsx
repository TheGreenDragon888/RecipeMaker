import React from 'react';
import { act } from 'react';
import { AccessibilityInfo, Text, View } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { DockBar } from '../../../src/ui/components/DockBar';
import { DockItem } from '../../../src/ui/components/DockItem';
import { indicatorOffset } from '../../../src/ui/motion/dockSwipe';
import { dockHiddenDrop } from '../../../src/ui/platform/dockLayout';
import { colors } from '../../../src/ui/theme';
import type { DockSurface } from '../../../src/ui/platform/dockSurface';
import { drag } from '../../support/drag';
import { placeViewsAt } from '../../support/measure';
import { iconDrawing, shownText, styleOf } from '../../support/screen';

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

  describe('swiping along the dock', () => {
    const wait = (ms: number) => act(async () => { jest.advanceTimersByTime(ms); });
    const openPantry = jest.fn();
    const openRecipes = jest.fn();
    const openBookmarks = jest.fn();
    /** Pantry is open unless `open` says another tab is; Bookmarks is disabled, as in the app. */
    const swipeDock = (open = 0) => (
      <DockBar surface="translucent" bottom={24}>
        <DockItem label="Pantry" icon="pantry" isFocused={open === 0} onPress={openPantry} />
        <DockItem label="Recipes" icon="recipes" isFocused={open === 1} onPress={openRecipes} />
        <DockItem label="Bookmarks" icon="bookmark" disabled onPress={openBookmarks} />
      </DockBar>
    );
    // The dock's row, which follows the finger. It sits at x 50, y 700 on screen, 276 × 64 px: the first tab
    // spans x 56–144, the second 144–232 and the third 232–320.
    const row = () => screen.getByTestId('dock-row');
    const onPantry = { x: 100, y: 730 };
    const onBookmarks = { x: 280, y: 730 };
    /** From Pantry, the distance that brings the finger over Recipes. */
    const toRecipes = 90;
    const opened = () => [openPantry, openRecipes, openBookmarks].map((open) => open.mock.calls.length);

    beforeEach(() => {
      jest.useFakeTimers();
      jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockReturnValue(new Promise<boolean>(() => {}));
      placeViewsAt({ x: 50, y: 700, width: 276, height: 64 });
      [openPantry, openRecipes, openBookmarks].forEach((open) => open.mockClear());
    });
    afterEach(() => {
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    it('moves the pill to the tab under the finger before it lets go', async () => {
      await render(swipeDock());
      drag(row(), [10, 40, toRecipes], { axis: 'x', from: onPantry, release: false });
      await wait(1500);
      expect(pillX()).toBe(indicatorOffset(1));
    });

    it('colors the tab under the finger as the selected one', async () => {
      await render(swipeDock());
      drag(row(), [10, 40, toRecipes], { axis: 'x', from: onPantry, release: false });
      expect([iconDrawing('pantry').props.stroke, iconDrawing('recipes').props.stroke]).toEqual([colors.textSecondary, colors.accent]);
    });

    it('still tells screen readers the open tab is the selected one', async () => {
      await render(swipeDock());
      drag(row(), [10, 40, toRecipes], { axis: 'x', from: onPantry, release: false });
      expect(screen.getByRole('tab', { name: 'Pantry' }).props.accessibilityState.selected).toBe(true);
    });

    it('opens the tab under the finger when it lets go', async () => {
      await render(swipeDock());
      drag(row(), [10, 40, toRecipes], { axis: 'x', from: onPantry });
      expect(opened()).toEqual([0, 1, 0]);
    });

    describe('after letting go, while the chosen tab is still opening', () => {
      it('keeps the pill on the chosen tab', async () => {
        await render(swipeDock());
        drag(row(), [10, 40, toRecipes], { axis: 'x', from: onPantry });
        await wait(1500);
        expect(pillX()).toBe(indicatorOffset(1));
      });

      it('keeps the chosen tab colored as the selected one', async () => {
        await render(swipeDock());
        drag(row(), [10, 40, toRecipes], { axis: 'x', from: onPantry });
        expect(iconDrawing('recipes').props.stroke).toBe(colors.accent);
      });

      it('follows the open tab again once it has opened', async () => {
        await render(swipeDock());
        drag(row(), [10, 40, toRecipes], { axis: 'x', from: onPantry });
        await screen.rerender(swipeDock(1));
        await screen.rerender(swipeDock(0));
        await wait(1500);
        expect(pillX()).toBe(indicatorOffset(0));
      });
    });

    it('moves the pill there at once with Reduce Motion on', async () => {
      jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
      await render(swipeDock());
      drag(row(), [10, 40, toRecipes], { axis: 'x', from: onPantry, release: false });
      expect(pillX()).toBe(indicatorOffset(1));
    });

    it('can start on the disabled Bookmarks tab', async () => {
      await render(swipeDock());
      drag(row(), [-10, -60, -130], { axis: 'x', from: onBookmarks });
      expect(opened()).toEqual([0, 1, 0]);
    });

    it('opens nothing when it lets go over the tab already open', async () => {
      await render(swipeDock());
      drag(row(), [10, 40, toRecipes, 20], { axis: 'x', from: onPantry });
      expect(opened()).toEqual([0, 0, 0]);
    });

    describe('over the disabled Bookmarks tab', () => {
      const toBookmarks = 190;

      it('moves the pill to the nearest tab that works, Recipes', async () => {
        await render(swipeDock());
        drag(row(), [10, toRecipes, toBookmarks], { axis: 'x', from: onPantry, release: false });
        await wait(1500);
        expect(pillX()).toBe(indicatorOffset(1));
      });

      it('opens Recipes when the finger lets go', async () => {
        await render(swipeDock());
        drag(row(), [10, toRecipes, toBookmarks], { axis: 'x', from: onPantry });
        expect(opened()).toEqual([0, 1, 0]);
      });
    });

    describe('when the finger slides well past the right end of the dock', () => {
      const offTheDock = 400;

      it('moves the pill to the rightmost tab that works, Recipes', async () => {
        await render(swipeDock());
        drag(row(), [10, toRecipes, offTheDock], { axis: 'x', from: onPantry, release: false });
        await wait(1500);
        expect(pillX()).toBe(indicatorOffset(1));
      });

      it('opens Recipes when the finger lets go', async () => {
        await render(swipeDock());
        drag(row(), [10, toRecipes, offTheDock], { axis: 'x', from: onPantry });
        expect(opened()).toEqual([0, 1, 0]);
      });
    });

    describe('when the finger slides well past the left end of the dock', () => {
      /** Recipes is open this time, so sliding off the left end has somewhere new to go. */
      const recipesOpenDock = () => (
        <DockBar surface="translucent" bottom={24}>
          <DockItem label="Pantry" icon="pantry" onPress={openPantry} />
          <DockItem label="Recipes" icon="recipes" isFocused onPress={openRecipes} />
          <DockItem label="Bookmarks" icon="bookmark" disabled onPress={openBookmarks} />
        </DockBar>
      );
      const onRecipes = { x: 190, y: 730 };
      const offTheDock = -400;

      it('moves the pill to the leftmost tab, Pantry', async () => {
        await render(recipesOpenDock());
        drag(row(), [-10, -90, offTheDock], { axis: 'x', from: onRecipes, release: false });
        await wait(1500);
        expect(pillX()).toBe(indicatorOffset(0));
      });

      it('opens Pantry when the finger lets go', async () => {
        await render(recipesOpenDock());
        drag(row(), [-10, -90, offTheDock], { axis: 'x', from: onRecipes });
        expect(opened()).toEqual([1, 0, 0]);
      });
    });

    describe('when the finger slides along well above the dock', () => {
      // 60 px above the dock's top edge (y 700), past the room allowed above it.
      const aboveTheDock = { x: 100, y: 640 };

      it('puts the pill back on the open tab', async () => {
        await render(swipeDock());
        drag(row(), [10, toRecipes], { axis: 'x', from: aboveTheDock, release: false });
        await wait(1500);
        expect(pillX()).toBe(indicatorOffset(0));
      });

      it('opens nothing when the finger lets go', async () => {
        await render(swipeDock());
        drag(row(), [10, toRecipes], { axis: 'x', from: aboveTheDock });
        expect(opened()).toEqual([0, 0, 0]);
      });
    });

    it('puts the pill back when something else takes the touch', async () => {
      await render(swipeDock());
      drag(row(), [10, toRecipes], { axis: 'x', from: onPantry, release: false });
      act(() => row().props.onResponderTerminate({ nativeEvent: {}, touchHistory: { touchBank: [] } }));
      await wait(1500);
      expect(pillX()).toBe(indicatorOffset(0));
    });

    it('opens nothing after a touch that never slid sideways', async () => {
      await render(swipeDock());
      drag(row(), [2, 4, 3], { axis: 'x', from: onBookmarks });
      expect(opened()).toEqual([0, 0, 0]);
    });

    it('leaves a tap to the tab itself', async () => {
      await render(swipeDock());
      await fireEvent.press(screen.getByRole('tab', { name: 'Recipes' }));
      expect(opened()).toEqual([0, 1, 0]);
    });
  });

  describe('hidden while a sheet is open', () => {
    const wait = (ms: number) => act(async () => { jest.advanceTimersByTime(ms); });
    const hiddenDock = (hidden: boolean) => (
      <DockBar surface="translucent" bottom={24} hidden={hidden}>
        {tabs(0)}
      </DockBar>
    );
    /** The dock as React Native draws it, including when screen readers are told to skip it. */
    const dockView = () => screen.container.queryAll((node) => node.props.accessibilityRole === 'tablist')[0];
    /** Only what tells screen readers to skip the dock (the whole props would include every tab). */
    const readerProps = () => {
      const { accessibilityElementsHidden, importantForAccessibility } = dockView().props;
      return { accessibilityElementsHidden, importantForAccessibility };
    };
    const dropped = () => (styleOf(dockView()).transform as { translateY: number }[])[0].translateY;

    beforeEach(() => {
      jest.useFakeTimers();
      jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockReturnValue(new Promise<boolean>(() => {}));
    });
    afterEach(() => {
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    it('stays in its place while shown', async () => {
      await render(hiddenDock(false));
      expect(dropped()).toBe(0);
    });

    it('slides part of the way down at first', async () => {
      await render(hiddenDock(false));
      await screen.rerender(hiddenDock(true));
      await wait(50);
      expect(dropped()).toBeGreaterThan(0);
      expect(dropped()).toBeLessThan(dockHiddenDrop(24));
    });

    it('ends below the bottom edge of the screen', async () => {
      await render(hiddenDock(false));
      await screen.rerender(hiddenDock(true));
      await wait(1500);
      expect(dropped()).toBe(dockHiddenDrop(24));
    });

    it('drops at once with Reduce Motion on', async () => {
      jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
      await render(hiddenDock(false));
      await screen.rerender(hiddenDock(true));
      expect(dropped()).toBe(dockHiddenDrop(24));
    });

    it('comes back up when shown again', async () => {
      await render(hiddenDock(true));
      await screen.rerender(hiddenDock(false));
      await wait(1500);
      expect(dropped()).toBe(0);
    });

    it('takes no touches', async () => {
      await render(hiddenDock(true));
      expect(dockView().props.pointerEvents).toBe('none');
    });

    it('is skipped by screen readers', async () => {
      await render(hiddenDock(true));
      expect(readerProps()).toEqual({ accessibilityElementsHidden: true, importantForAccessibility: 'no-hide-descendants' });
    });

    it('is read by screen readers again once shown', async () => {
      await render(hiddenDock(false));
      expect(readerProps()).toEqual({ accessibilityElementsHidden: false, importantForAccessibility: 'auto' });
    });
  });
});
