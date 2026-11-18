import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { BookmarkButton } from '../../../src/ui/components/BookmarkButton';
import { pressedScale } from '../../../src/ui/motion/pressFeedback';
import { colors } from '../../../src/ui/theme';
import { iconDrawing, scaleWhilePressed, styleOf } from '../../support/screen';

const button = () => screen.getByRole('button');

describe('BookmarkButton', () => {
  it('names the recipe and reports it as saved', async () => {
    await render(<BookmarkButton recipeName="Chili" saved onPress={jest.fn()} />);
    expect([button().props.accessibilityLabel, button().props.accessibilityState]).toEqual([
      'Remove Chili from bookmarks',
      { selected: true },
    ]);
  });

  it('offers to save a recipe that is not saved', async () => {
    await render(<BookmarkButton recipeName="Chili" saved={false} onPress={jest.fn()} />);
    expect([button().props.accessibilityLabel, button().props.accessibilityState]).toEqual([
      'Save Chili',
      { selected: false },
    ]);
  });

  it('fills its icon when the recipe is saved', async () => {
    await render(<BookmarkButton recipeName="Chili" saved onPress={jest.fn()} />);
    expect(iconDrawing('bookmark').props.fill).toBe(colors.accent);
  });

  it('draws its icon as an outline when the recipe is not saved', async () => {
    await render(<BookmarkButton recipeName="Chili" saved={false} onPress={jest.fn()} />);
    expect(iconDrawing('bookmark').props.fill).toBe('none');
  });

  it('calls onPress when tapped', async () => {
    const onPress = jest.fn();
    await render(<BookmarkButton recipeName="Chili" saved={false} onPress={onPress} />);
    await fireEvent.press(button());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('has a 44 px touch area on a card', async () => {
    await render(<BookmarkButton recipeName="Chili" saved={false} onPress={jest.fn()} />);
    expect([styleOf(button()).width, styleOf(button()).height]).toEqual([44, 44]);
  });

  it("is the board's 52 px outlined button in a footer", async () => {
    await render(<BookmarkButton recipeName="Chili" saved={false} onPress={jest.fn()} variant="footer" />);
    const { width, height, borderWidth, borderColor } = styleOf(button());
    expect({ width, height, borderWidth, borderColor }).toEqual({ width: 52, height: 52, borderWidth: 1, borderColor: colors.border });
  });

  it('shrinks while a finger is on it', async () => {
    await render(<BookmarkButton recipeName="Chili" saved={false} onPress={jest.fn()} />);
    expect(await scaleWhilePressed(button())).toBeCloseTo(pressedScale('small', false), 3);
  });
});
