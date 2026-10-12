import React from 'react';
import { act } from 'react-test-renderer';
import { PantryItemRow } from '../../../src/ui/components/PantryItemRow';
import { render, shownText } from '../../support/render';

describe('PantryItemRow', () => {
  it('shows the ingredient name', () => {
    const renderer = render(<PantryItemRow name="green onion" onRemove={() => {}} />);
    expect(shownText(renderer)).toContain('green onion');
  });

  it('calls onRemove when its remove button is pressed', () => {
    const onRemove = jest.fn();
    const renderer = render(<PantryItemRow name="green onion" onRemove={onRemove} />);
    act(() => renderer.root.findByProps({ accessibilityLabel: 'Remove green onion' }).props.onPress());
    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
