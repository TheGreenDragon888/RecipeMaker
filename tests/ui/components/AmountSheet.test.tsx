import React from 'react';
import { Keyboard } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { PantryItem } from '../../../src/domain/pantry';
import { shownPantryAmount } from '../../../src/domain/pantry';
import { pantryUnitChoices } from '../../../src/domain/unitConversions';
import { AmountSheet } from '../../../src/ui/components/AmountSheet';
import { shownOfType, shownText } from '../../support/screen';

const flour: PantryItem = { name: 'all-purpose flour', quantity: 2, unit: 'cup' };

type SheetProps = React.ComponentProps<typeof AmountSheet>;
const renderSheet = (props: Partial<SheetProps> = {}) => {
  const item = props.item ?? flour;
  return render(
    <AmountSheet
      item={item}
      choices={item.unit ? pantryUnitChoices(item.name, item.unit) : []}
      onSave={() => {}}
      onClose={() => {}}
      {...props}
    />,
  );
};

const field = () => screen.getByLabelText('Amount');
const save = () => screen.getByRole('button', { name: 'Save' });
const chip = (label: string) => screen.getByRole('radio', { name: label });
const press = (name: string) => fireEvent.press(screen.getByRole('button', { name }));

afterEach(() => jest.restoreAllMocks());

describe('AmountSheet', () => {
  describe('header', () => {
    it("shows the ingredient's name, how it is counted, and how much is on hand", async () => {
      await renderSheet();
      expect(shownText()).toEqual(expect.arrayContaining(['All-purpose Flour', 'Counted in cups', 'Now 2 cups']));
    });

    it('shows the amount on hand in the unit the user picked', async () => {
      await renderSheet({ item: { ...flour, shownUnit: 'tbsp' } });
      expect(shownText()).toContain('Now 32 tbsp');
    });
  });

  describe('amount field', () => {
    it('starts at the amount on hand', async () => {
      await renderSheet();
      expect(field().props.value).toBe('2');
    });

    it('starts in the unit the user picked, with that unit under it', async () => {
      await renderSheet({ item: { ...flour, shownUnit: 'tbsp' } });
      expect([field().props.value, shownText()]).toEqual(['32', expect.arrayContaining(['tbsp'])]);
    });

    it('opens the number pad and selects the number, so typing replaces it', async () => {
      await renderSheet();
      expect([field().props.keyboardType, field().props.selectTextOnFocus]).toEqual(['decimal-pad', true]);
    });

    it.each([
      ['Subtract 5 cups', '0'],
      ['Subtract 1 cup', '1'],
      ['Add 1 cup', '3'],
      ['Add 5 cups', '7'],
    ])('"%s" changes 2 to %s', async (button, expected) => {
      await renderSheet();
      await press(button);
      expect(field().props.value).toBe(expected);
    });

    it('steps from a typed amount', async () => {
      await renderSheet();
      await fireEvent.changeText(field(), '1.5');
      await press('Add 1 cup');
      expect(field().props.value).toBe('2.5');
    });

    it('names its unit on the step buttons after a unit is picked', async () => {
      await renderSheet();
      await fireEvent.press(chip('tbsp'));
      expect(screen.getByRole('button', { name: 'Add 5 tbsp' })).toBeOnTheScreen();
    });
  });

  describe('unit chips', () => {
    it("offers the ingredient's units in order, with the current one picked", async () => {
      await renderSheet();
      const chips = screen.getAllByRole('radio');
      expect(chips.map((c) => c.props.accessibilityLabel)).toEqual(['cups', 'tsp', 'tbsp', 'mL', 'L']);
      expect(chip('cups')).toBeChecked();
    });

    it('converts the amount when another unit is picked (2 cups is 32 tbsp)', async () => {
      await renderSheet();
      await fireEvent.press(chip('tbsp'));
      expect([field().props.value, chip('tbsp').props.accessibilityState.checked]).toEqual(['32', true]);
    });

    it('keeps the exact amount through a unit change, so the field rounds only what it shows', async () => {
      await renderSheet();
      await fireEvent.press(chip('mL'));
      expect(field().props.value).toBe('473');
      await fireEvent.press(chip('cups'));
      expect(field().props.value).toBe('2');
    });

    it('keeps taps on a chip working while the keyboard is open', async () => {
      await renderSheet();
      const row = shownOfType('RCTScrollView').find((view) => view.props.horizontal);
      expect(row?.props.keyboardShouldPersistTaps).toBe('handled');
    });

    it('explains the "≈" when the unit picked is an estimate', async () => {
      await renderSheet({ item: { name: 'cheddar cheese', quantity: 1, unit: 'cup' } });
      await fireEvent.press(chip('oz'));
      expect(shownText()).toContain('≈ Estimated from a typical size');
    });

    it('says nothing about estimates for an exact unit', async () => {
      await renderSheet();
      await fireEvent.press(chip('tbsp'));
      expect(shownText()).not.toContain('≈ Estimated from a typical size');
    });

    it('is left out when the ingredient has only its own unit', async () => {
      await renderSheet({ item: { name: 'black bean', quantity: 2, unit: 'can' } });
      expect([screen.queryAllByRole('radio'), shownText()]).toEqual([[], expect.not.arrayContaining(['Unit'])]);
    });

    it('is left out when the unit is not known', async () => {
      await renderSheet({ item: { name: 'garlic', quantity: 2, unit: null } });
      expect(screen.queryAllByRole('radio')).toEqual([]);
    });
  });

  describe('Save', () => {
    it('saves the amount and unit in the field', async () => {
      const onSave = jest.fn();
      await renderSheet({ onSave });
      await fireEvent.changeText(field(), '3,5');
      await fireEvent.press(save());
      expect(onSave).toHaveBeenCalledWith(3.5, 'cup');
    });

    it('saves in the unit picked', async () => {
      const onSave = jest.fn();
      await renderSheet({ onSave });
      await fireEvent.press(chip('tbsp'));
      await fireEvent.press(save());
      expect(onSave).toHaveBeenCalledWith(32, 'tbsp');
    });

    it('saves an unchanged amount exactly, not as the rounded text in the field', async () => {
      const onSave = jest.fn();
      const mushroom: PantryItem = { name: 'mushroom', quantity: 4, unit: 'oz', shownUnit: 'g' };
      await renderSheet({ item: mushroom, onSave });
      await fireEvent.press(save());
      expect(onSave).toHaveBeenCalledWith(shownPantryAmount(mushroom).amount, 'g');
    });

    it('closes the keyboard', async () => {
      const dismiss = jest.spyOn(Keyboard, 'dismiss');
      await renderSheet();
      await fireEvent.press(save());
      expect(dismiss).toHaveBeenCalled();
    });

    it.each(['', '0', '1/2', 'abc'])('is disabled for "%s"', async (text) => {
      await renderSheet();
      await fireEvent.changeText(field(), text);
      expect(save()).toBeDisabled();
    });

    it('is disabled over the maximum, and says what the maximum is', async () => {
      await renderSheet();
      await fireEvent.changeText(field(), '100');
      expect([save().props.accessibilityState.disabled, shownText()]).toEqual([true, expect.arrayContaining(['Up to 99 cups'])]);
    });

    it('works for an item with no unit', async () => {
      const onSave = jest.fn();
      await renderSheet({ item: { name: 'garlic', quantity: 2, unit: null }, onSave });
      await press('Add 1');
      await fireEvent.press(save());
      expect(onSave).toHaveBeenCalledWith(3, null);
    });
  });

  describe('closing without saving', () => {
    it('closes from the grab bar without saving', async () => {
      const onClose = jest.fn();
      const onSave = jest.fn();
      await renderSheet({ onClose, onSave });
      await fireEvent.changeText(field(), '5');
      await press('Close without saving');
      expect([onClose.mock.calls.length, onSave.mock.calls.length]).toEqual([1, 0]);
    });
  });
});
