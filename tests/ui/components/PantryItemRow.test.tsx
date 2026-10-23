import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { TestInstance } from 'test-renderer';
import { PantryItemRow } from '../../../src/ui/components/PantryItemRow';
import { shownIcons, shownText, styleOf } from '../../support/screen';

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

const button = (label: string) => screen.getByLabelText(label);

function ancestors(node: TestInstance) {
  const found: TestInstance[] = [];
  for (let parent = node.parent; parent; parent = parent.parent) found.push(parent);
  return found;
}

describe('PantryItemRow', () => {
  it('shows the ingredient name, capitalized as the mockup does', async () => {
    await renderRow();
    expect(shownText()).toContain('Green Onion');
  });

  it('shows the quantity', async () => {
    await renderRow({ quantity: 3 });
    expect(shownText()).toContain('3');
  });

  it('shows the unit after the quantity, pluralized to match it', async () => {
    await renderRow({ quantity: 3, unit: 'clove' });
    expect(shownText()).toContain('cloves');
  });

  it('shows the singular unit for a quantity of 1', async () => {
    await renderRow({ quantity: 1, unit: 'cup', decreaseRemoves: true });
    expect(shownText()).toContain('cup');
  });

  it('shows only the quantity when the unit is not known', async () => {
    await renderRow({ quantity: 3, unit: null });
    expect(shownText()).toEqual(['Green Onion', '3']);
  });

  describe('increase button', () => {
    it('calls onIncrease when pressed', async () => {
      const onIncrease = jest.fn();
      await renderRow({ onIncrease });
      await fireEvent.press(button('Increase green onion quantity'));
      expect(onIncrease).toHaveBeenCalledTimes(1);
    });

    it('draws a plus icon', async () => {
      await renderRow();
      expect(shownIcons(button('Increase green onion quantity'))).toEqual(['plus']);
    });

    it('is enabled below the maximum', async () => {
      const onIncrease = jest.fn();
      await renderRow({ canIncrease: true, onIncrease });
      await fireEvent.press(button('Increase green onion quantity'));
      expect(onIncrease).toHaveBeenCalled();
    });

    it('is disabled at the maximum', async () => {
      const onIncrease = jest.fn();
      await renderRow({ canIncrease: false, onIncrease });
      await fireEvent.press(button('Increase green onion quantity'));
      expect(onIncrease).not.toHaveBeenCalled();
    });

    it('tells screen readers it is disabled at the maximum', async () => {
      await renderRow({ canIncrease: false });
      expect(button('Increase green onion quantity').props.accessibilityState).toEqual({ disabled: true });
    });
  });

  describe('decrease button', () => {
    it('calls onDecrease when pressed', async () => {
      const onDecrease = jest.fn();
      await renderRow({ onDecrease });
      await fireEvent.press(button('Decrease green onion quantity'));
      expect(onDecrease).toHaveBeenCalledTimes(1);
    });

    it('draws a minus icon when pressing it lowers the quantity', async () => {
      await renderRow({ decreaseRemoves: false });
      expect(shownIcons(button('Decrease green onion quantity'))).toEqual(['minus']);
    });

    it('is labelled "Remove" when pressing it removes the ingredient', async () => {
      await renderRow({ quantity: 1, decreaseRemoves: true });
      expect(button('Remove green onion')).toBeOnTheScreen();
    });

    it('draws a close icon when pressing it removes the ingredient', async () => {
      await renderRow({ quantity: 1, decreaseRemoves: true });
      expect(shownIcons(button('Remove green onion'))).toEqual(['close']);
    });

    it('calls onDecrease when pressed as the remove button', async () => {
      const onDecrease = jest.fn();
      await renderRow({ quantity: 1, decreaseRemoves: true, onDecrease });
      await fireEvent.press(button('Remove green onion'));
      expect(onDecrease).toHaveBeenCalledTimes(1);
    });
  });

  describe('touch areas', () => {
    it.each(['Decrease green onion quantity', 'Increase green onion quantity'])('gives "%s" a 44px square', async (label) => {
      await renderRow();
      const style = styleOf(button(label));
      expect(style.width).toBeGreaterThanOrEqual(44);
      expect(style.height).toBeGreaterThanOrEqual(44);
    });

    // Android only delivers a tap to a child inside its parent's bounds, so the 34px outlined pill
    // must be drawn behind the buttons, never around them.
    it.each(['Decrease green onion quantity', 'Increase green onion quantity'])('does not put "%s" inside the pill', async (label) => {
      await renderRow();
      const pill = screen.getByTestId('quantity-pill');
      expect(ancestors(button(label))).not.toContain(pill);
    });
  });
});
