import React from 'react';
import { act, type ReactTestRenderer } from 'react-test-renderer';
import { PrimaryButton } from '../../../src/ui/components/PrimaryButton';
import { render, shownText } from '../../support/render';
import { Icon } from '../../../src/ui/components/Icon';

const button = (renderer: ReactTestRenderer) => renderer.root.findByProps({ accessibilityRole: 'button' });

describe('PrimaryButton', () => {
  it('shows its label', () => {
    const renderer = render(<PrimaryButton label="Return to Pantry" onPress={() => {}} />);
    expect(shownText(renderer)).toContain('Return to Pantry');
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const renderer = render(<PrimaryButton label="Go" onPress={onPress} />);
    act(() => button(renderer).props.onPress());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is marked disabled when disabled', () => {
    const renderer = render(<PrimaryButton label="Go" onPress={() => {}} disabled />);
    expect(button(renderer).props.accessibilityState).toEqual({ disabled: true });
  });

  it('is announced by its label alone, without the arrow', () => {
    const renderer = render(<PrimaryButton label="Find recipes" onPress={() => {}} showArrow />);
    expect(button(renderer).props.accessibilityLabel).toBe('Find recipes');
  });

  it('draws an arrow icon after the label when showArrow is set', () => {
    const renderer = render(<PrimaryButton label="Find recipes" onPress={() => {}} showArrow />);
    expect(renderer.root.findByType(Icon).props.name).toBe('arrowRight');
  });

  it('draws no icon without showArrow', () => {
    const renderer = render(<PrimaryButton label="Return to Pantry" onPress={() => {}} />);
    expect(renderer.root.findAllByType(Icon)).toHaveLength(0);
  });
});
