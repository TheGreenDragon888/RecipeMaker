import React from 'react';
import { act, type ReactTestInstance } from 'react-test-renderer';
import { StyleSheet } from 'react-native';
import { PantryItemRow } from '../../../src/ui/components/PantryItemRow';
import { render, shownText } from '../../support/render';
import { Icon } from '../../../src/ui/components/Icon';

type RowProps = React.ComponentProps<typeof PantryItemRow>;

function renderRow(props: Partial<RowProps> = {}) {
  return render(
    <PantryItemRow
      name="green onion"
      quantity={3}
      canIncrease
      decreaseRemoves={false}
      onIncrease={() => {}}
      onDecrease={() => {}}
      {...props}
    />,
  );
}

const button = (renderer: ReturnType<typeof render>, label: string) => renderer.root.findByProps({ accessibilityLabel: label });

function ancestors(node: ReactTestInstance) {
  const found: ReactTestInstance[] = [];
  for (let parent = node.parent; parent; parent = parent.parent) found.push(parent);
  return found;
}

describe('PantryItemRow', () => {
  it('shows the ingredient name, capitalized as the mockup does', () => {
    expect(shownText(renderRow())).toContain('Green Onion');
  });

  it('shows the quantity', () => {
    expect(shownText(renderRow({ quantity: 3 }))).toContain('3');
  });

  it('shows the unit after the quantity, pluralized to match it', () => {
    expect(shownText(renderRow({ quantity: 3, unit: 'clove' }))).toContain('cloves');
  });

  it('shows the singular unit for a quantity of 1', () => {
    expect(shownText(renderRow({ quantity: 1, unit: 'cup', decreaseRemoves: true }))).toContain('cup');
  });

  it('shows only the quantity when the unit is not known', () => {
    expect(shownText(renderRow({ quantity: 3, unit: null }))).toEqual(['Green Onion', '3']);
  });

  describe('increase button', () => {
    it('calls onIncrease when pressed', () => {
      const onIncrease = jest.fn();
      const renderer = renderRow({ onIncrease });
      act(() => button(renderer, 'Increase green onion quantity').props.onPress());
      expect(onIncrease).toHaveBeenCalledTimes(1);
    });

    it('draws a plus icon', () => {
      const renderer = renderRow();
      expect(button(renderer, 'Increase green onion quantity').findByType(Icon).props.name).toBe('plus');
    });

    it('is enabled below the maximum', () => {
      const renderer = renderRow({ canIncrease: true });
      expect(button(renderer, 'Increase green onion quantity').props.disabled).toBe(false);
    });

    it('is disabled at the maximum', () => {
      const renderer = renderRow({ canIncrease: false });
      expect(button(renderer, 'Increase green onion quantity').props.disabled).toBe(true);
    });

    it('tells screen readers it is disabled at the maximum', () => {
      const renderer = renderRow({ canIncrease: false });
      expect(button(renderer, 'Increase green onion quantity').props.accessibilityState).toEqual({ disabled: true });
    });
  });

  describe('decrease button', () => {
    it('calls onDecrease when pressed', () => {
      const onDecrease = jest.fn();
      const renderer = renderRow({ onDecrease });
      act(() => button(renderer, 'Decrease green onion quantity').props.onPress());
      expect(onDecrease).toHaveBeenCalledTimes(1);
    });

    it('draws a minus icon when pressing it lowers the quantity', () => {
      const renderer = renderRow({ decreaseRemoves: false });
      expect(button(renderer, 'Decrease green onion quantity').findByType(Icon).props.name).toBe('minus');
    });

    it('is labelled "Remove" when pressing it removes the ingredient', () => {
      const renderer = renderRow({ quantity: 1, decreaseRemoves: true });
      expect(button(renderer, 'Remove green onion')).toBeTruthy();
    });

    it('draws a close icon when pressing it removes the ingredient', () => {
      const renderer = renderRow({ quantity: 1, decreaseRemoves: true });
      expect(button(renderer, 'Remove green onion').findByType(Icon).props.name).toBe('close');
    });

    it('calls onDecrease when pressed as the remove button', () => {
      const onDecrease = jest.fn();
      const renderer = renderRow({ quantity: 1, decreaseRemoves: true, onDecrease });
      act(() => button(renderer, 'Remove green onion').props.onPress());
      expect(onDecrease).toHaveBeenCalledTimes(1);
    });
  });

  describe('touch areas', () => {
    it.each(['Decrease green onion quantity', 'Increase green onion quantity'])('gives "%s" a 44px square', (label) => {
      const style = StyleSheet.flatten(button(renderRow(), label).props.style);
      expect(style.width).toBeGreaterThanOrEqual(44);
      expect(style.height).toBeGreaterThanOrEqual(44);
    });

    // Android only delivers a tap to a child inside its parent's bounds, so the 34px outlined pill
    // must be drawn behind the buttons, never around them.
    it.each(['Decrease green onion quantity', 'Increase green onion quantity'])('does not put "%s" inside the pill', (label) => {
      const renderer = renderRow();
      const pill = renderer.root.findByProps({ testID: 'quantity-pill' });
      expect(ancestors(button(renderer, label))).not.toContain(pill);
    });
  });
});
