import React from 'react';
import { act } from 'react-test-renderer';
import { StateMessage } from '../../../src/ui/components/StateMessage';
import { render, shownText } from '../../support/render';

describe('StateMessage', () => {
  it('shows its message', () => {
    const renderer = render(<StateMessage message="No recipes match your pantry." />);
    expect(shownText(renderer)).toContain('No recipes match your pantry.');
  });

  it('shows a button labeled with the action', () => {
    const renderer = render(<StateMessage message="Nothing here." action={{ label: 'Back to pantry', onPress: () => {} }} />);
    expect(renderer.root.findByProps({ accessibilityLabel: 'Back to pantry' }).props.accessibilityRole).toBe('button');
  });

  it('runs the action when its button is pressed', () => {
    const onPress = jest.fn();
    const renderer = render(<StateMessage message="Nothing here." action={{ label: 'Back to pantry', onPress }} />);
    act(() => renderer.root.findByProps({ accessibilityLabel: 'Back to pantry' }).props.onPress());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows no button without an action', () => {
    const renderer = render(<StateMessage message="Nothing here." />);
    expect(() => renderer.root.findByProps({ accessibilityRole: 'button' })).toThrow();
  });
});
