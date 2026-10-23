import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { PrimaryButton } from '../../../src/ui/components/PrimaryButton';
import { shownIcons, shownText } from '../../support/screen';

describe('PrimaryButton', () => {
  it('shows its label', async () => {
    await render(<PrimaryButton label="Return to Pantry" onPress={() => {}} />);
    expect(shownText()).toContain('Return to Pantry');
  });

  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    await render(<PrimaryButton label="Go" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is marked disabled when disabled', async () => {
    await render(<PrimaryButton label="Go" onPress={() => {}} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is announced by its label alone, without the arrow', async () => {
    await render(<PrimaryButton label="Find recipes" onPress={() => {}} showArrow />);
    expect(screen.getByRole('button')).toHaveAccessibleName('Find recipes');
  });

  it('draws an arrow icon after the label when showArrow is set', async () => {
    await render(<PrimaryButton label="Find recipes" onPress={() => {}} showArrow />);
    expect(shownIcons()).toEqual(['arrowRight']);
  });

  it('draws no icon without showArrow', async () => {
    await render(<PrimaryButton label="Return to Pantry" onPress={() => {}} />);
    expect(shownIcons()).toEqual([]);
  });
});
