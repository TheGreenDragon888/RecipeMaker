import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { ReadinessFilterChips } from '../../../src/ui/components/ReadinessFilterChips';
import { colors } from '../../../src/ui/theme';
import { styleOf } from '../../support/screen';

const counts = { all: 6, ready: 2, swap: 1, almost: 3 };
const show = (onSelect = jest.fn()) => render(<ReadinessFilterChips selected="swap" counts={counts} onSelect={onSelect} />);

describe('ReadinessFilterChips', () => {
  it.each([
    ['All, 6'],
    ['Ready now, 2'],
    ['Swap, 1'],
    ['Almost there, 3'],
  ])('shows the %s chip', async (name) => {
    await show();
    expect(screen.getByRole('button', { name })).toBeOnTheScreen();
  });

  it('marks the selected chip', async () => {
    await show();
    expect(screen.getByRole('button', { name: 'Swap, 1' })).toBeSelected();
  });

  it('leaves the other chips unselected', async () => {
    await show();
    expect(screen.getByRole('button', { name: 'All, 6' })).not.toBeSelected();
  });

  it('reports the chip that was tapped', async () => {
    const onSelect = jest.fn();
    await show(onSelect);
    await fireEvent.press(screen.getByRole('button', { name: 'Almost there, 3' }));
    expect(onSelect).toHaveBeenCalledWith('almost');
  });

  it("colors an unselected chip for its status", async () => {
    await show();
    expect(styleOf(screen.getByText('Ready now')).color).toBe(colors.green);
  });
});
