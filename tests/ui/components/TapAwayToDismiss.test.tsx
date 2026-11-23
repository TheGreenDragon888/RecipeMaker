import React from 'react';
import { Keyboard, Pressable, Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { TapAwayToDismiss } from '../../../src/ui/components/TapAwayToDismiss';
import { styleOf } from '../../support/screen';

describe('TapAwayToDismiss', () => {
  let dismiss: jest.SpyInstance;
  beforeEach(() => {
    dismiss = jest.spyOn(Keyboard, 'dismiss');
  });
  afterEach(() => {
    dismiss.mockRestore();
  });

  it('shows what it wraps', async () => {
    await render(
      <TapAwayToDismiss>
        <Text>My Pantry</Text>
      </TapAwayToDismiss>,
    );
    expect(screen.getByText('My Pantry')).toBeOnTheScreen();
  });

  it('closes the keyboard when blank space inside it is tapped', async () => {
    await render(
      <TapAwayToDismiss>
        <Text>My Pantry</Text>
      </TapAwayToDismiss>,
    );
    await fireEvent.press(screen.getByText('My Pantry'));
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('closes the keyboard when the wrapper itself is tapped', async () => {
    await render(<TapAwayToDismiss testID="area" />);
    await fireEvent.press(screen.getByTestId('area'));
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('tells its screen it was tapped, so the screen can close what it floats', async () => {
    const onDismiss = jest.fn();
    await render(
      <TapAwayToDismiss onDismiss={onDismiss}>
        <Text>My Pantry</Text>
      </TapAwayToDismiss>,
    );
    await fireEvent.press(screen.getByText('My Pantry'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('leaves a button inside it to do its own job', async () => {
    const onPress = jest.fn();
    const onDismiss = jest.fn();
    await render(
      <TapAwayToDismiss onDismiss={onDismiss}>
        <Pressable accessibilityRole="button" accessibilityLabel="Add" onPress={onPress} />
      </TapAwayToDismiss>,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Add' }));
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onDismiss).not.toHaveBeenCalled();
    expect(dismiss).not.toHaveBeenCalled();
  });

  it('is not a button to a screen reader', async () => {
    await render(
      <TapAwayToDismiss>
        <Text>My Pantry</Text>
      </TapAwayToDismiss>,
    );
    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
  });

  it('fills the space its screen gives it', async () => {
    await render(<TapAwayToDismiss testID="area" />);
    expect(styleOf(screen.getByTestId('area')).flex).toBe(1);
  });

  it('is only as big as what it holds when it is told not to fill, as a header-sized part of a screen is', async () => {
    await render(<TapAwayToDismiss testID="area" fill={false} />);
    expect(styleOf(screen.getByTestId('area')).flex).toBeUndefined();
  });

  it('still closes the keyboard when it does not fill', async () => {
    const dismiss = jest.spyOn(Keyboard, 'dismiss');
    await render(<TapAwayToDismiss testID="area" fill={false} />);
    await fireEvent.press(screen.getByTestId('area'));
    expect(dismiss).toHaveBeenCalledTimes(1);
  });

  it('takes a style that adds to filling the space', async () => {
    await render(<TapAwayToDismiss testID="area" style={{ backgroundColor: 'white' }} />);
    expect(styleOf(screen.getByTestId('area'))).toMatchObject({ flex: 1, backgroundColor: 'white' });
  });
});
