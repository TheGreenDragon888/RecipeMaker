import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { BackButton } from '../../../src/ui/components/BackButton';
import { colors } from '../../../src/ui/theme';
import { shownIcons, styleOf } from '../../support/screen';

describe('BackButton', () => {
  it('is announced by its label', async () => {
    await render(<BackButton label="Back to pantry" onPress={() => {}} />);
    expect(screen.getByRole('button')).toHaveAccessibleName('Back to pantry');
  });

  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    await render(<BackButton label="Back to pantry" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('draws a chevron icon', async () => {
    await render(<BackButton label="Back to pantry" onPress={() => {}} />);
    expect(shownIcons()).toEqual(['chevronLeft']);
  });

  it('has an outline by default', async () => {
    await render(<BackButton label="Back to pantry" onPress={() => {}} />);
    expect(styleOf(screen.getByRole('button')).borderWidth).toBe(1);
  });

  it('has no outline and a see-through fill over the recipe banner', async () => {
    await render(<BackButton label="Back to recipes" onPress={() => {}} overBanner />);
    const style = styleOf(screen.getByRole('button'));
    expect([style.borderWidth ?? 0, style.backgroundColor]).toEqual([0, colors.surfaceTranslucent]);
  });
});
