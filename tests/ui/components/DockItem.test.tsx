import React from 'react';
import { StyleSheet } from 'react-native';
import { act, type ReactTestRenderer } from 'react-test-renderer';
import { DockItem } from '../../../src/ui/components/DockItem';
import { Icon } from '../../../src/ui/components/Icon';
import { colors } from '../../../src/ui/theme';
import { render, shownText } from '../../support/render';

const tab = (renderer: ReactTestRenderer) => renderer.root.findByProps({ accessibilityRole: 'tab' });
const tabStyle = (renderer: ReactTestRenderer) => StyleSheet.flatten(tab(renderer).props.style({ pressed: false }));

describe('DockItem', () => {
  it('shows its label', () => {
    const renderer = render(<DockItem label="Pantry" icon="pantry" />);
    expect(shownText(renderer)).toEqual(['Pantry']);
  });

  it('draws its icon', () => {
    const renderer = render(<DockItem label="Recipes" icon="recipes" />);
    expect(renderer.root.findByType(Icon).props.name).toBe('recipes');
  });

  it('is announced by its label', () => {
    const renderer = render(<DockItem label="Pantry" icon="pantry" />);
    expect(tab(renderer).props.accessibilityLabel).toBe('Pantry');
  });

  it('is announced by a different label when one is given', () => {
    const renderer = render(<DockItem label="Bookmarks" icon="bookmark" accessibilityLabel="Bookmarks, coming soon" />);
    expect(tab(renderer).props.accessibilityLabel).toBe('Bookmarks, coming soon');
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const renderer = render(<DockItem label="Recipes" icon="recipes" onPress={onPress} />);
    act(() => tab(renderer).props.onPress());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  describe('as the current tab', () => {
    it('is marked selected', () => {
      const renderer = render(<DockItem label="Pantry" icon="pantry" isFocused />);
      expect(tab(renderer).props.accessibilityState).toEqual({ selected: true, disabled: false });
    });

    it('sits on the accent-tinted pill', () => {
      const renderer = render(<DockItem label="Pantry" icon="pantry" isFocused />);
      expect(tabStyle(renderer).backgroundColor).toBe(colors.accentTint);
    });

    it('draws its icon in the accent color', () => {
      const renderer = render(<DockItem label="Pantry" icon="pantry" isFocused />);
      expect(renderer.root.findByType(Icon).props.color).toBe(colors.accent);
    });
  });

  describe('as another tab', () => {
    it('is not marked selected', () => {
      const renderer = render(<DockItem label="Recipes" icon="recipes" />);
      expect(tab(renderer).props.accessibilityState).toEqual({ selected: false, disabled: false });
    });

    it('has no pill behind it', () => {
      const renderer = render(<DockItem label="Recipes" icon="recipes" />);
      expect(tabStyle(renderer).backgroundColor).toBeUndefined();
    });

    it('draws its icon in the secondary text color', () => {
      const renderer = render(<DockItem label="Recipes" icon="recipes" />);
      expect(renderer.root.findByType(Icon).props.color).toBe(colors.textSecondary);
    });
  });

  describe('when disabled', () => {
    it('is marked disabled for screen readers', () => {
      const renderer = render(<DockItem label="Bookmarks" icon="bookmark" disabled />);
      expect(tab(renderer).props.accessibilityState).toEqual({ selected: false, disabled: true });
    });

    it('ignores presses', () => {
      const renderer = render(<DockItem label="Bookmarks" icon="bookmark" disabled />);
      expect(tab(renderer).props.disabled).toBe(true);
    });

    it('is drawn at half opacity, as on the board', () => {
      const renderer = render(<DockItem label="Bookmarks" icon="bookmark" disabled />);
      expect(tabStyle(renderer).opacity).toBe(0.5);
    });
  });
});
