import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { FilterChip } from '../../../src/ui/components/FilterChip';
import { colors } from '../../../src/ui/theme';
import { shownText, styleOf } from '../../support/screen';

const chip = () => screen.getByRole('button');
const props = { label: 'Ready now', count: 2, color: colors.green, onPress: jest.fn() };

describe('FilterChip', () => {
  it('shows its label and count', async () => {
    await render(<FilterChip {...props} selected={false} />);
    expect(shownText()).toEqual(['Ready now', '2']);
  });

  it('reads its label and count to screen readers', async () => {
    await render(<FilterChip {...props} selected={false} />);
    expect(chip()).toHaveAccessibleName('Ready now, 2');
  });

  it('reports whether it is selected', async () => {
    await render(<FilterChip {...props} selected />);
    expect(chip().props.accessibilityState).toEqual({ selected: true });
  });

  it('is filled with the accent color when selected', async () => {
    await render(<FilterChip {...props} selected />);
    expect(styleOf(chip()).backgroundColor).toBe(colors.accent);
  });

  it('writes its label in its own color when not selected', async () => {
    await render(<FilterChip {...props} selected={false} />);
    expect(styleOf(screen.getByText('Ready now')).color).toBe(colors.green);
  });

  it('writes its label in the on-accent color when selected', async () => {
    await render(<FilterChip {...props} selected />);
    expect(styleOf(screen.getByText('Ready now')).color).toBe(colors.onAccent);
  });

  it('calls onPress when tapped', async () => {
    const onPress = jest.fn();
    await render(<FilterChip {...props} selected={false} onPress={onPress} />);
    await fireEvent.press(chip());
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
