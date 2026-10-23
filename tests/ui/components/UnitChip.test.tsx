import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { UnitChip } from '../../../src/ui/components/UnitChip';
import { colors } from '../../../src/ui/theme';
import { styleOf } from '../../support/screen';

describe('UnitChip', () => {
  it('is a choice named by its label', async () => {
    await render(<UnitChip label="tbsp" selected={false} onPress={() => {}} />);
    expect(screen.getByRole('radio', { name: 'tbsp' })).toBeOnTheScreen();
  });

  it('shows as chosen when selected', async () => {
    await render(<UnitChip label="cups" selected onPress={() => {}} />);
    expect(screen.getByRole('radio', { name: 'cups' })).toBeChecked();
  });

  it('shows as not chosen otherwise', async () => {
    await render(<UnitChip label="cups" selected={false} onPress={() => {}} />);
    expect(screen.getByRole('radio', { name: 'cups' })).not.toBeChecked();
  });

  it('is blue when selected, as on the board', async () => {
    await render(<UnitChip label="cups" selected onPress={() => {}} />);
    expect(styleOf(screen.getByRole('radio', { name: 'cups' }))).toEqual(
      expect.objectContaining({ backgroundColor: colors.blueSoft, borderColor: colors.blue }),
    );
  });

  it('is at least 44 px tall and 88 px wide', async () => {
    await render(<UnitChip label="g" selected={false} onPress={() => {}} />);
    expect(styleOf(screen.getByRole('radio', { name: 'g' }))).toEqual(expect.objectContaining({ minHeight: 44, minWidth: 88 }));
  });

  it('calls onPress when tapped', async () => {
    const onPress = jest.fn();
    await render(<UnitChip label="mL" selected={false} onPress={onPress} />);
    await fireEvent.press(screen.getByRole('radio', { name: 'mL' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
