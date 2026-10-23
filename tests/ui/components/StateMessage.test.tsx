import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { StateMessage } from '../../../src/ui/components/StateMessage';
import { shownText } from '../../support/screen';

describe('StateMessage', () => {
  it('shows its message', async () => {
    await render(<StateMessage message="No recipes match your pantry." />);
    expect(shownText()).toContain('No recipes match your pantry.');
  });

  it('shows a button labeled with the action', async () => {
    await render(<StateMessage message="Nothing here." action={{ label: 'Back to pantry', onPress: () => {} }} />);
    expect(screen.getByRole('button', { name: 'Back to pantry' })).toBeOnTheScreen();
  });

  it('runs the action when its button is pressed', async () => {
    const onPress = jest.fn();
    await render(<StateMessage message="Nothing here." action={{ label: 'Back to pantry', onPress }} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Back to pantry' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows no button without an action', async () => {
    await render(<StateMessage message="Nothing here." />);
    expect(screen.queryByRole('button')).not.toBeOnTheScreen();
  });
});
