import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { DockItem } from '../../../src/ui/components/DockItem';
import { colors } from '../../../src/ui/theme';
import { fadedViews, fadesAsOnePicture, iconDrawing, pressIn, shownIcons, shownText, styleOf } from '../../support/screen';

const tab = () => screen.getByRole('tab');

describe('DockItem', () => {
  it('shows its label', async () => {
    await render(<DockItem label="Pantry" icon="pantry" />);
    expect(shownText()).toEqual(['Pantry']);
  });

  it('draws its icon', async () => {
    await render(<DockItem label="Recipes" icon="recipes" />);
    expect(shownIcons()).toEqual(['recipes']);
  });

  it('is announced by its label', async () => {
    await render(<DockItem label="Pantry" icon="pantry" />);
    expect(tab()).toHaveAccessibleName('Pantry');
  });

  it('is announced by a different label when one is given', async () => {
    await render(<DockItem label="Bookmarks" icon="bookmark" accessibilityLabel="Bookmarks, coming soon" />);
    expect(tab()).toHaveAccessibleName('Bookmarks, coming soon');
  });

  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    await render(<DockItem label="Recipes" icon="recipes" onPress={onPress} />);
    await fireEvent.press(tab());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  describe('as the current tab', () => {
    it('is marked selected', async () => {
      await render(<DockItem label="Pantry" icon="pantry" isFocused />);
      expect(tab().props.accessibilityState).toEqual({ selected: true, disabled: false });
    });

    it('sits on the accent-tinted pill', async () => {
      await render(<DockItem label="Pantry" icon="pantry" isFocused />);
      expect(styleOf(tab()).backgroundColor).toBe(colors.accentTint);
    });

    it('draws its icon in the accent color', async () => {
      await render(<DockItem label="Pantry" icon="pantry" isFocused />);
      expect(iconDrawing('pantry').props.stroke).toBe(colors.accent);
    });
  });

  describe('as another tab', () => {
    it('is not marked selected', async () => {
      await render(<DockItem label="Recipes" icon="recipes" />);
      expect(tab().props.accessibilityState).toEqual({ selected: false, disabled: false });
    });

    it('has no pill behind it', async () => {
      await render(<DockItem label="Recipes" icon="recipes" />);
      expect(styleOf(tab()).backgroundColor).toBeUndefined();
    });

    it('draws its icon in the secondary text color', async () => {
      await render(<DockItem label="Recipes" icon="recipes" />);
      expect(iconDrawing('recipes').props.stroke).toBe(colors.textSecondary);
    });
  });

  describe('when disabled', () => {
    it('is marked disabled for screen readers', async () => {
      await render(<DockItem label="Bookmarks" icon="bookmark" disabled />);
      expect(tab().props.accessibilityState).toEqual({ selected: false, disabled: true });
    });

    it('ignores presses', async () => {
      const onPress = jest.fn();
      await render(<DockItem label="Bookmarks" icon="bookmark" disabled onPress={onPress} />);
      await fireEvent.press(tab());
      expect(onPress).not.toHaveBeenCalled();
    });

    it('is drawn at half opacity, as on the board', async () => {
      await render(<DockItem label="Bookmarks" icon="bookmark" disabled />);
      expect(styleOf(tab()).opacity).toBe(0.5);
    });

    it('fades as one picture', async () => {
      await render(<DockItem label="Bookmarks" icon="bookmark" disabled />);
      expect(fadedViews().map(fadesAsOnePicture)).toEqual([true]);
    });
  });

  describe('while pressed', () => {
    it('fades as one picture', async () => {
      await render(<DockItem label="Pantry" icon="pantry" isFocused />);
      await pressIn(tab());
      expect(fadedViews().map(fadesAsOnePicture)).toEqual([true]);
    });
  });
});
