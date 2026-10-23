import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SheetFooterButton, SheetGrabBar, SheetHeader, SheetSectionLabel } from '../../../src/ui/components/SheetParts';
import { colors } from '../../../src/ui/theme';
import { iconDrawing, shownIcons, shownText } from '../../support/screen';

describe('SheetGrabBar', () => {
  it('is a button with the label it is given', async () => {
    await render(<SheetGrabBar label="Close without saving" onPress={() => {}} />);
    expect(screen.getByRole('button', { name: 'Close without saving' })).toBeOnTheScreen();
  });

  it('calls onPress when tapped', async () => {
    const onPress = jest.fn();
    await render(<SheetGrabBar label="Close" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Close' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('SheetHeader', () => {
  const header = <SheetHeader icon="pantry" title="Garlic" subtitle="Counted in cloves" badge="Now 2 cloves" />;

  it('shows its title, subtitle and badge', async () => {
    await render(header);
    expect(shownText()).toEqual(['Garlic', 'Counted in cloves', 'Now 2 cloves']);
  });

  it('draws its icon in blue', async () => {
    await render(header);
    expect(shownIcons()).toEqual(['pantry']);
    expect(iconDrawing('pantry').props.stroke).toBe(colors.blue);
  });

  it('keeps a long title to one line', async () => {
    await render(header);
    expect(screen.getByText('Garlic').props.numberOfLines).toBe(1);
  });
});

describe('SheetSectionLabel', () => {
  it('shows its text', async () => {
    await render(<SheetSectionLabel text="Unit" />);
    expect(shownText()).toEqual(['Unit']);
  });
});

describe('SheetFooterButton', () => {
  it('is a button with its label as text', async () => {
    await render(<SheetFooterButton label="Save" onPress={() => {}} />);
    expect(screen.getByRole('button', { name: 'Save' })).toBeOnTheScreen();
  });

  it('calls onPress when tapped', async () => {
    const onPress = jest.fn();
    await render(<SheetFooterButton label="Done" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('can be disabled, and then ignores taps', async () => {
    const onPress = jest.fn();
    await render(<SheetFooterButton label="Save" onPress={onPress} disabled />);
    const button = screen.getByRole('button', { name: 'Save' });
    await fireEvent.press(button);
    expect(button).toBeDisabled();
    expect(onPress).not.toHaveBeenCalled();
  });
});
