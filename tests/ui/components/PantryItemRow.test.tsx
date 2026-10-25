import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { TestInstance } from 'test-renderer';
import { PantryItemRow } from '../../../src/ui/components/PantryItemRow';
import { fadedViews, fadesAsOnePicture, shownIcons, shownText, styleOf } from '../../support/screen';

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

    it('fades its circle as one picture at the maximum', async () => {
      await renderRow({ canIncrease: false });
      expect(fadedViews().map(fadesAsOnePicture)).toEqual([true]);
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

  describe('amounts in other units', () => {
    it('shows a fraction rounded for its unit', async () => {
      await renderRow({ quantity: 2.0625, unit: 'cup' });
      expect(shownText()).toEqual(expect.arrayContaining(['2.06', 'cups']));
    });

    it('shows metric units as written, rounded to whole numbers', async () => {
      await renderRow({ quantity: 473.176, unit: 'ml' });
      expect(shownText()).toEqual(expect.arrayContaining(['473', 'mL']));
    });

    it('marks an approximate amount with "≈"', async () => {
      await renderRow({ quantity: 6, unit: 'oz', approximate: true });
      expect(shownText()).toContain('≈ 6');
    });

    it('names the unit − / + step in when it differs from the one shown', async () => {
      await renderRow({ name: 'milk', quantity: 473, unit: 'ml', stepUnit: 'cup' });
      expect([button('Increase milk by 1 cup'), button('Decrease milk by 1 cup')]).toHaveLength(2);
    });
  });

  describe('amount button', () => {
    const edit = () => screen.getByRole('button', { name: 'Edit amount and unit for green onion' });

    it('opens the amount sheet when tapped', async () => {
      const onEditAmount = jest.fn();
      await renderRow({ onEditAmount, hasOtherUnits: true });
      await fireEvent.press(edit());
      expect(onEditAmount).toHaveBeenCalledTimes(1);
    });

    it('holds the amount, and tells screen readers what it is', async () => {
      await renderRow({ quantity: 3, unit: 'stalk', onEditAmount: () => {}, hasOtherUnits: true });
      expect([shownText(edit()).join(''), edit().props.accessibilityValue]).toEqual([
        '3 stalks',
        expect.objectContaining({ text: '3 stalks' }),
      ]);
    });

    it('says only the amount can be edited when there are no other units', async () => {
      await renderRow({ onEditAmount: () => {}, hasOtherUnits: false });
      expect(screen.getByRole('button', { name: 'Edit amount for green onion' })).toBeOnTheScreen();
    });

    it('is 44px tall and not inside the pill', async () => {
      await renderRow({ onEditAmount: () => {}, hasOtherUnits: true });
      expect([styleOf(edit()).height, ancestors(edit()).includes(screen.getByTestId('quantity-pill'))]).toEqual([44, false]);
    });

    it('is not a button without onEditAmount', async () => {
      await renderRow();
      expect(screen.queryByRole('button', { name: /^Edit amount/ })).toBeNull();
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
