import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ChoiceChip } from '../../../src/ui/components/ChoiceChip';
import { colors } from '../../../src/ui/theme';
import { styleOf } from '../../support/screen';

const chip = () => screen.getByRole('button');

describe('ChoiceChip', () => {
  it('shows its label', async () => {
    await render(<ChoiceChip label="30 min" selected={false} onPress={() => {}} />);
    expect(screen.getByText('30 min')).toBeOnTheScreen();
  });

  it('is named by its label', async () => {
    await render(<ChoiceChip label="30 min" selected={false} onPress={() => {}} />);
    expect(chip()).toHaveAccessibleName('30 min');
  });

  it('reports whether it is selected', async () => {
    await render(<ChoiceChip label="30 min" selected onPress={() => {}} />);
    expect(chip().props.accessibilityState).toEqual({ selected: true });
  });

  it('is tinted blue when selected', async () => {
    await render(<ChoiceChip label="30 min" selected onPress={() => {}} />);
    expect([styleOf(chip()).backgroundColor, styleOf(chip()).borderColor]).toEqual([colors.blueSoft, colors.blue]);
  });

  it('writes its label in blue when selected', async () => {
    await render(<ChoiceChip label="30 min" selected onPress={() => {}} />);
    expect(styleOf(screen.getByText('30 min')).color).toBe(colors.blue);
  });

  it('is plain when not selected', async () => {
    await render(<ChoiceChip label="30 min" selected={false} onPress={() => {}} />);
    expect([styleOf(chip()).backgroundColor, styleOf(chip()).borderColor]).toEqual([colors.surface, colors.border]);
  });

  it('is at least 44 px tall, so a finger can hit it', async () => {
    await render(<ChoiceChip label="30 min" selected={false} onPress={() => {}} />);
    expect(styleOf(chip()).minHeight).toBeGreaterThanOrEqual(44);
  });

  it('calls onPress when tapped', async () => {
    const onPress = jest.fn();
    await render(<ChoiceChip label="30 min" selected={false} onPress={onPress} />);
    await fireEvent.press(chip());
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
