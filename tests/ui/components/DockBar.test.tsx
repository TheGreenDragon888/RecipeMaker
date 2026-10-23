import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView } from 'expo-glass-effect';
import type { ReactTestRenderer } from 'react-test-renderer';
import { DockBar } from '../../../src/ui/components/DockBar';
import { colors } from '../../../src/ui/theme';
import type { DockSurface } from '../../../src/ui/platform/dockSurface';
import { render, shownText } from '../../support/render';

const renderBar = (surface: DockSurface, blurTarget?: React.RefObject<React.ComponentRef<typeof View> | null>, bottom = 24) =>
  render(
    <DockBar surface={surface} bottom={bottom} blurTarget={blurTarget}>
      <Text>Pantry</Text>
      <Text>Recipes</Text>
    </DockBar>,
  );
const tabList = (renderer: ReactTestRenderer) => renderer.root.findByProps({ accessibilityRole: 'tablist' });

describe('DockBar', () => {
  it('shows the tabs given to it', () => {
    expect(shownText(renderBar('translucent'))).toEqual(['Pantry', 'Recipes']);
  });

  it('floats at the distance it is given from the bottom of the screen', () => {
    expect(StyleSheet.flatten(tabList(renderBar('translucent', undefined, 34)).props.style).bottom).toBe(34);
  });

  it('is a tab list for screen readers', () => {
    expect(() => tabList(renderBar('translucent'))).not.toThrow();
  });

  describe('with Liquid Glass', () => {
    it('draws the tabs on interactive glass', () => {
      const glass = renderBar('liquidGlass').root.findByType(GlassView);
      expect(glass.props.isInteractive).toBe(true);
    });

    it('does not blur', () => {
      expect(renderBar('liquidGlass').root.findAllByType(BlurView)).toHaveLength(0);
    });
  });

  describe('with a blur', () => {
    it('draws the tabs on a blur of whatever is behind the dock', () => {
      const blur = renderBar('blur').root.findByType(BlurView);
      expect(blur.props.blurTarget).toBeUndefined();
    });

    it('does not use glass', () => {
      expect(renderBar('blur').root.findAllByType(GlassView)).toHaveLength(0);
    });
  });

  describe('with the Android blur', () => {
    it('blurs the given target view', () => {
      const target = React.createRef<React.ComponentRef<typeof View>>();
      const blur = renderBar('androidBlur', target).root.findByType(BlurView);
      expect(blur.props.blurTarget).toBe(target);
    });

    it('uses the Android 12+ blur method', () => {
      const blur = renderBar('androidBlur', React.createRef<React.ComponentRef<typeof View>>()).root.findByType(BlurView);
      expect(blur.props.blurMethod).toBe('dimezisBlurViewSdk31Plus');
    });
  });

  describe('as a plain translucent bar', () => {
    it('neither blurs nor uses glass', () => {
      const renderer = renderBar('translucent');
      expect([renderer.root.findAllByType(BlurView), renderer.root.findAllByType(GlassView)]).toEqual([[], []]);
    });

    it('fills with the see-through dock color', () => {
      expect(StyleSheet.flatten(tabList(renderBar('translucent')).props.style).backgroundColor).toBe(colors.dockSurface);
    });
  });
});
