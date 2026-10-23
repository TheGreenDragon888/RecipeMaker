import {
  ESTIMATE_NOTE,
  formatAmountForInput,
  formatAmountLimit,
  formatCountedIn,
  formatEditAmountLabel,
  formatNowBadge,
  formatPantryAmount,
  formatQuantityStepLabel,
  formatSheetStepLabel,
  formatUnitChoice,
  parseAmountText,
} from '../../../src/ui/format/pantryAmount';

describe('formatPantryAmount', () => {
  it.each([
    [2, 'cup', '2'],
    [1.5, 'cup', '1 1/2'],
    [31.9999, 'tbsp', '32'],
    [2.0625, 'cup', '2.06'],
    [473.176, 'ml', '473'],
    [4.929, 'ml', '4.9'],
    [170.097, 'g', '170'],
    [0.4732, 'l', '0.47'],
    [1.5, 'kg', '1.5'],
    [3, null, '3'],
  ])('shows %p %s as "%s"', (amount, unit, expected) => {
    expect(formatPantryAmount(amount, unit)).toBe(expected);
  });

  it('marks an approximate amount with "≈"', () => {
    expect(formatPantryAmount(6, 'oz', true)).toBe('≈ 6');
  });

  it('shows a tiny metric amount instead of 0', () => {
    expect(formatPantryAmount(0.04, 'g')).toBe('0.04');
  });
});

describe('formatAmountForInput', () => {
  it.each([
    [2, 'cup', '2'],
    [0.25, 'cup', '0.25'],
    [2.0625, 'cup', '2.06'],
    [473.176, 'ml', '473'],
    [4.929, 'g', '4.9'],
    [5, null, '5'],
  ])('writes %p %s in the field as "%s" (a plain decimal: the number pad has no "/")', (amount, unit, expected) => {
    expect(formatAmountForInput(amount, unit)).toBe(expected);
  });

  it('writes 0 as "0"', () => {
    expect(formatAmountForInput(0, 'cup')).toBe('0');
  });
});

describe('parseAmountText', () => {
  it.each([
    ['2', 2],
    ['1.5', 1.5],
    ['1,5', 1.5],
    [' 2 ', 2],
    ['.5', 0.5],
    ['2.', 2],
    ['0', 0],
  ])('reads "%s" as %p', (text, expected) => {
    expect(parseAmountText(text)).toBe(expected);
  });

  it.each(['', '  ', '.', 'abc', '1/2', '1.2.3', '-1', '2 cups'])('cannot read "%s"', (text) => {
    expect(parseAmountText(text)).toBeNull();
  });
});

describe('formatNowBadge', () => {
  it('says how much is on hand now', () => {
    expect(formatNowBadge(2, 'clove')).toBe('Now 2 cloves');
  });

  it('keeps an approximate marker', () => {
    expect(formatNowBadge(6, 'oz', true)).toBe('Now ≈ 6 oz');
  });

  it('leaves the unit out when there is none', () => {
    expect(formatNowBadge(3, null)).toBe('Now 3');
  });
});

describe('formatCountedIn', () => {
  it('names the pantry unit in the plural', () => {
    expect(formatCountedIn('clove')).toBe('Counted in cloves');
  });

  it('says "one at a time" for "each"', () => {
    expect(formatCountedIn('each')).toBe('Counted one at a time');
  });

  it('says there is no unit when it is not known', () => {
    expect(formatCountedIn(null)).toBe('No unit');
  });
});

describe('formatUnitChoice', () => {
  it.each([
    ['cup', 'cups'],
    ['clove', 'cloves'],
    ['tbsp', 'tbsp'],
    ['ml', 'mL'],
    ['each', 'each'],
    ['dozen', 'dozen'],
  ])('labels the "%s" chip "%s"', (unit, expected) => {
    expect(formatUnitChoice(unit)).toBe(expected);
  });
});

describe('formatEditAmountLabel', () => {
  it('says the amount and unit can be edited', () => {
    expect(formatEditAmountLabel('garlic', true)).toBe('Edit amount and unit for garlic');
  });

  it('says only the amount can be edited when there is one unit', () => {
    expect(formatEditAmountLabel('black bean', false)).toBe('Edit amount for black bean');
  });
});

describe('formatSheetStepLabel', () => {
  it.each([
    [-5, 'cup', 'Subtract 5 cups'],
    [-1, 'cup', 'Subtract 1 cup'],
    [1, 'tbsp', 'Add 1 tbsp'],
    [5, 'clove', 'Add 5 cloves'],
    [1, null, 'Add 1'],
  ])('labels the %p button for %s "%s"', (step, unit, expected) => {
    expect(formatSheetStepLabel(step, unit)).toBe(expected);
  });
});

describe('formatQuantityStepLabel', () => {
  it('says "quantity" when a step is 1 of the unit shown', () => {
    expect(formatQuantityStepLabel('increase', 'flour', null)).toBe('Increase flour quantity');
  });

  it('names the unit a step counts in when it is not the one shown (an item shown in mL)', () => {
    expect(formatQuantityStepLabel('decrease', 'milk', 'cup')).toBe('Decrease milk by 1 cup');
  });
});

describe('formatAmountLimit', () => {
  it('says the most that can be saved', () => {
    expect(formatAmountLimit(1584, 'tbsp')).toBe('Up to 1584 tbsp');
  });
});

describe('ESTIMATE_NOTE', () => {
  it('explains the "≈"', () => {
    expect(ESTIMATE_NOTE).toBe('≈ Estimated from a typical size');
  });
});
