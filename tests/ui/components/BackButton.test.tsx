import React from 'react';
import { act, type ReactTestRenderer } from 'react-test-renderer';
import { BackButton } from '../../../src/ui/components/BackButton';
import { render } from '../../support/render';

const button = (renderer: ReactTestRenderer) => renderer.root.findByProps({ accessibilityRole: 'button' });

describe('BackButton', () => {
  it('is announced by its label', () => {
    const renderer = render(<BackButton label="Back to pantry" onPress={() => {}} />);
    expect(button(renderer).props.accessibilityLabel).toBe('Back to pantry');
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const renderer = render(<BackButton label="Back to pantry" onPress={onPress} />);
    act(() => button(renderer).props.onPress());
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
