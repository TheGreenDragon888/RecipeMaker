import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ClearFieldButton } from '../../../src/ui/components/ClearFieldButton';
import { pressedScale } from '../../../src/ui/motion/pressFeedback';
import { scaleWhilePressed, shownIcons, styleOf } from '../../support/screen';

describe('ClearFieldButton', () => {
  it('is announced by its label', async () => {
    await render(<ClearFieldButton label="Clear search" onPress={() => {}} />);
    expect(screen.getByRole('button')).toHaveAccessibleName('Clear search');
  });

  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    await render(<ClearFieldButton label="Clear search" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('draws the close icon', async () => {
    await render(<ClearFieldButton label="Clear search" onPress={() => {}} />);
    expect(shownIcons()).toEqual(['close']);
  });

  it('reaches past its edges so a thumb can hit it', async () => {
    await render(<ClearFieldButton label="Clear search" onPress={() => {}} />);
    const button = screen.getByRole('button');
    const size = (styleOf(button).width as number) + 2 * (button.props.hitSlop as number);
    expect(size).toBeGreaterThanOrEqual(44);
  });

  it('shrinks while a finger is on it', async () => {
    await render(<ClearFieldButton label="Clear search" onPress={() => {}} />);
    expect(await scaleWhilePressed(screen.getByRole('button'))).toBeCloseTo(pressedScale('small', false), 3);
  });
});
