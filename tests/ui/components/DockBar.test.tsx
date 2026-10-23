import React from 'react';
import { Text, View } from 'react-native';
import { render, screen } from '@testing-library/react-native';
import { DockBar } from '../../../src/ui/components/DockBar';
import { colors } from '../../../src/ui/theme';
import type { DockSurface } from '../../../src/ui/platform/dockSurface';
import { shownOfType, shownText, styleOf } from '../../support/screen';

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
const glass = () => shownOfType('ViewManagerAdapter_ExpoGlassEffect');

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

  describe('with Liquid Glass', () => {
    it('draws the tabs on interactive glass', async () => {
      await renderBar('liquidGlass');
      expect(glass()[0].props.isInteractive).toBe(true);
    });

    it('does not blur', async () => {
      await renderBar('liquidGlass');
      expect(blur()).not.toBeOnTheScreen();
    });
  });

  describe('with a blur', () => {
    it('draws the tabs on a blur of whatever is behind the dock', async () => {
      await renderBar('blur');
      expect(blur()!.props.blurTarget).toBeUndefined();
    });

    it('does not use glass', async () => {
      await renderBar('blur');
      expect(glass()).toHaveLength(0);
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
    it('neither blurs nor uses glass', async () => {
      await renderBar('translucent');
      expect([blur(), glass()]).toEqual([null, []]);
    });

    it('fills with the see-through dock color', async () => {
      await renderBar('translucent');
      expect(styleOf(tabList()).backgroundColor).toBe(colors.dockSurface);
    });
  });
});
