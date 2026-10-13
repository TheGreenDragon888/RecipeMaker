import React from 'react';
import { act } from 'react-test-renderer';
import { StyleSheet } from 'react-native';
import { PantryItemRow } from '../../../src/ui/components/PantryItemRow';
import { render, shownText } from '../../support/render';
import { Icon } from '../../../src/ui/components/Icon';

describe('PantryItemRow', () => {
  it('shows the ingredient name, capitalized as the mockup does', () => {
    const renderer = render(<PantryItemRow name="green onion" onRemove={() => {}} />);
    expect(shownText(renderer)).toContain('Green Onion');
  });

  it('calls onRemove when its remove button is pressed', () => {
    const onRemove = jest.fn();
    const renderer = render(<PantryItemRow name="green onion" onRemove={onRemove} />);
    act(() => renderer.root.findByProps({ accessibilityLabel: 'Remove green onion' }).props.onPress());
    expect(onRemove).toHaveBeenCalledTimes(1);
  });

  it('draws a close icon in its remove button', () => {
    const renderer = render(<PantryItemRow name="green onion" onRemove={() => {}} />);
    expect(renderer.root.findByType(Icon).props.name).toBe('close');
  });

  it('makes the whole outlined pill the button, so it can be tapped anywhere on it', () => {
    const renderer = render(<PantryItemRow name="green onion" onRemove={() => {}} />);
    const remove = renderer.root.findByProps({ accessibilityLabel: 'Remove green onion' });
    expect(StyleSheet.flatten(remove.props.style).borderWidth).toBe(1);
  });

  it('reaches a 44px touch area around the 34px pill', () => {
    const renderer = render(<PantryItemRow name="green onion" onRemove={() => {}} />);
    const remove = renderer.root.findByProps({ accessibilityLabel: 'Remove green onion' });
    expect(34 + 2 * remove.props.hitSlop).toBeGreaterThanOrEqual(44);
  });
});
