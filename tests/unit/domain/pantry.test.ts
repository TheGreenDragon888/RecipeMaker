import {
  addPantryItem,
  canIncreasePantryQuantity,
  decreasePantryQuantity,
  decreaseRemovesPantryItem,
  increasePantryQuantity,
  isValidPantryAmount,
  MAX_PANTRY_QUANTITY,
  pantryAmountLimit,
  pantryStepUnit,
  setPantryItemAmount,
  shownPantryAmount,
  stepDraftAmount,
  pantryNamesForMatching,
  toggleSeasoning,
  turnOnSeasoning,
  type PantryItem,
} from '../../../src/domain/pantry';

const item = (name: string, quantity = 1, unit: string | null = null): PantryItem => ({ name, quantity, unit });

describe('addPantryItem', () => {
  it("stores the ingredient's pantry unit", () => {
    expect(addPantryItem([], 'garlic', 'clove')).toEqual([item('garlic', 1, 'clove')]);
  });

  it('stores no unit when none is given', () => {
    expect(addPantryItem([], 'garlic')[0].unit).toBeNull();
  });

  it('adds a new ingredient to the end of the pantry', () => {
    expect(addPantryItem([item('egg')], 'tomato')).toEqual([item('egg'), item('tomato')]);
  });

  it('starts a new ingredient at a quantity of 1', () => {
    expect(addPantryItem([], 'tomato')[0].quantity).toBe(1);
  });

  it('trims spaces around the typed ingredient', () => {
    expect(addPantryItem([], '  tomato ')).toEqual([item('tomato')]);
  });

  it('ignores blank text', () => {
    expect(addPantryItem([item('egg')], '   ')).toEqual([item('egg')]);
  });

  it('ignores an ingredient already in the pantry, whatever its case or spacing', () => {
    expect(addPantryItem([item('Green  Onion', 3)], ' green onion')).toEqual([item('Green  Onion', 3)]);
  });

  it('keeps different names for the same ingredient as separate items', () => {
    expect(addPantryItem([item('scallions')], 'green onion')).toEqual([item('scallions'), item('green onion')]);
  });

  it('does not change the original pantry list', () => {
    const pantry = [item('egg')];
    addPantryItem(pantry, 'tomato');
    expect(pantry).toEqual([item('egg')]);
  });
});

describe('increasePantryQuantity', () => {
  it('raises the named ingredient by 1', () => {
    expect(increasePantryQuantity([item('egg', 2)], 'egg')).toEqual([item('egg', 3)]);
  });

  it('leaves the other ingredients alone', () => {
    expect(increasePantryQuantity([item('egg'), item('tomato', 4)], 'egg')).toEqual([item('egg', 2), item('tomato', 4)]);
  });

  it('finds the ingredient whatever its case or spacing', () => {
    expect(increasePantryQuantity([item('Green  Onion')], ' green onion')).toEqual([item('Green  Onion', 2)]);
  });

  it('does not go above the maximum', () => {
    expect(increasePantryQuantity([item('egg', MAX_PANTRY_QUANTITY)], 'egg')).toEqual([item('egg', MAX_PANTRY_QUANTITY)]);
  });

  it('changes nothing when the ingredient is not in the pantry', () => {
    expect(increasePantryQuantity([item('egg')], 'tomato')).toEqual([item('egg')]);
  });

  it('does not change the original pantry list', () => {
    const pantry = [item('egg')];
    increasePantryQuantity(pantry, 'egg');
    expect(pantry).toEqual([item('egg')]);
  });
});

describe('decreasePantryQuantity', () => {
  it('lowers the named ingredient by 1', () => {
    expect(decreasePantryQuantity([item('egg', 3)], 'egg')).toEqual([item('egg', 2)]);
  });

  it('removes the ingredient when it goes from 1 to 0, keeping the others in order', () => {
    expect(decreasePantryQuantity([item('egg'), item('milk'), item('tomato')], 'milk')).toEqual([item('egg'), item('tomato')]);
  });

  it('finds the ingredient whatever its case or spacing', () => {
    expect(decreasePantryQuantity([item('Green  Onion', 2)], ' green onion')).toEqual([item('Green  Onion', 1)]);
  });

  it('changes nothing when the ingredient is not in the pantry', () => {
    expect(decreasePantryQuantity([item('egg')], 'tomato')).toEqual([item('egg')]);
  });

  it('does not change the original pantry list', () => {
    const pantry = [item('egg', 2)];
    decreasePantryQuantity(pantry, 'egg');
    expect(pantry).toEqual([item('egg', 2)]);
  });
});

describe('MAX_PANTRY_QUANTITY', () => {
  it('is 99', () => {
    expect(MAX_PANTRY_QUANTITY).toBe(99);
  });
});

describe('canIncreasePantryQuantity', () => {
  it('is true below the maximum', () => {
    expect(canIncreasePantryQuantity(item('egg', MAX_PANTRY_QUANTITY - 1))).toBe(true);
  });

  it('is false at the maximum', () => {
    expect(canIncreasePantryQuantity(item('egg', MAX_PANTRY_QUANTITY))).toBe(false);
  });
});

describe('decreaseRemovesPantryItem', () => {
  it('is true at a quantity of 1', () => {
    expect(decreaseRemovesPantryItem(item('egg', 1))).toBe(true);
  });

  it('is false above 1', () => {
    expect(decreaseRemovesPantryItem(item('egg', 2))).toBe(false);
  });
});

describe('toggleSeasoning', () => {
  it('switches a seasoning on by adding it to the end of the list', () => {
    expect(toggleSeasoning(['paprika'], 'ground cumin')).toEqual(['paprika', 'ground cumin']);
  });

  it('switches a seasoning off by removing it', () => {
    expect(toggleSeasoning(['paprika', 'ground cumin'], 'paprika')).toEqual(['ground cumin']);
  });

  it('finds the seasoning whatever its case or spacing', () => {
    expect(toggleSeasoning(['Ground  Cumin'], ' ground cumin')).toEqual([]);
  });

  it('ignores blank text', () => {
    expect(toggleSeasoning(['paprika'], '  ')).toEqual(['paprika']);
  });

  it('does not change the original list', () => {
    const on = ['paprika'];
    toggleSeasoning(on, 'ground cumin');
    expect(on).toEqual(['paprika']);
  });
});

describe('pantryNamesForMatching', () => {
  it('lists the pantry ingredients, then the seasonings that are on', () => {
    expect(pantryNamesForMatching([item('egg', 3, 'each'), item('garlic', 2, 'clove')], ['paprika'])).toEqual([
      'egg',
      'garlic',
      'paprika',
    ]);
  });

  it('is empty when there is nothing in the pantry and no seasoning is on', () => {
    expect(pantryNamesForMatching([], [])).toEqual([]);
  });
});

describe('turnOnSeasoning', () => {
  it('switches a seasoning on', () => {
    expect(turnOnSeasoning(['paprika'], 'ground cumin')).toEqual(['paprika', 'ground cumin']);
  });

  it('leaves a seasoning on when it is already on, whatever its case', () => {
    expect(turnOnSeasoning(['Ground Cumin'], 'ground cumin')).toEqual(['Ground Cumin']);
  });
});

// ── Amounts shown in another unit (the amount sheet's unit chips) ──

/** An item kept in its pantry unit but shown in another one. */
const shownIn = (name: string, quantity: number, unit: string, shownUnit: string): PantryItem => ({
  name,
  quantity,
  unit,
  shownUnit,
});

describe('shownPantryAmount', () => {
  it('is the quantity in the pantry unit when no other unit was chosen', () => {
    expect(shownPantryAmount(item('garlic', 2, 'clove'))).toEqual({ amount: 2, unit: 'clove', approximate: false });
  });

  it('converts the quantity to the chosen unit', () => {
    expect(shownPantryAmount(shownIn('flour', 2, 'cup', 'tbsp'))).toEqual({ amount: 32, unit: 'tbsp', approximate: false });
  });

  it('says when the conversion rests on a typical size or density', () => {
    expect(shownPantryAmount(shownIn('cheddar cheese', 0.5, 'cup', 'oz'))).toEqual({ amount: 2, unit: 'oz', approximate: true });
  });

  it('has no unit when the item has none', () => {
    expect(shownPantryAmount(item('garlic', 3))).toEqual({ amount: 3, unit: null, approximate: false });
  });
});

describe('pantryStepUnit', () => {
  it('is the pantry unit when no other unit was chosen', () => {
    expect(pantryStepUnit(item('flour', 2, 'cup'))).toBe('cup');
  });

  it('is the chosen unit', () => {
    expect(pantryStepUnit(shownIn('flour', 2, 'cup', 'tbsp'))).toBe('tbsp');
  });

  it.each(['ml', 'g'])('is the pantry unit when the item is shown in %s (a step of 1 would be too small)', (shownUnit) => {
    expect(pantryStepUnit(shownIn('cheddar cheese', 1, 'cup', shownUnit))).toBe('cup');
  });

  it('is null when the item has no unit', () => {
    expect(pantryStepUnit(item('flour', 2))).toBeNull();
  });
});

describe('increasePantryQuantity in a chosen unit', () => {
  it('raises the item by 1 of the chosen unit (2 cups + 1 tbsp)', () => {
    expect(increasePantryQuantity([shownIn('flour', 2, 'cup', 'tbsp')], 'flour')).toEqual([shownIn('flour', 2.0625, 'cup', 'tbsp')]);
  });

  it('raises the item by 1 pantry unit when it is shown in mL', () => {
    expect(increasePantryQuantity([shownIn('milk', 2, 'cup', 'ml')], 'milk')).toEqual([shownIn('milk', 3, 'cup', 'ml')]);
  });

  it('stops at the maximum instead of going past it (90 tbsp + 1 cup)', () => {
    expect(increasePantryQuantity([shownIn('butter', 90, 'tbsp', 'cup')], 'butter')).toEqual([shownIn('butter', 99, 'tbsp', 'cup')]);
  });
});

describe('decreasePantryQuantity in a chosen unit', () => {
  it('lowers the item by 1 of the chosen unit (2 cups − 1 tbsp)', () => {
    expect(decreasePantryQuantity([shownIn('flour', 2, 'cup', 'tbsp')], 'flour')).toEqual([shownIn('flour', 1.9375, 'cup', 'tbsp')]);
  });

  it('removes the item when less than 1 of the chosen unit is left', () => {
    expect(decreasePantryQuantity([shownIn('flour', 0.05, 'cup', 'tbsp')], 'flour')).toEqual([]);
  });
});

describe('canIncreasePantryQuantity with a fraction', () => {
  it('is true just below the maximum', () => {
    expect(canIncreasePantryQuantity(shownIn('butter', 98.5, 'tbsp', 'cup'))).toBe(true);
  });
});

describe('decreaseRemovesPantryItem in a chosen unit', () => {
  it('is true when exactly 1 of the chosen unit is left (1 tbsp of a cup item)', () => {
    expect(decreaseRemovesPantryItem(shownIn('flour', 0.0625, 'cup', 'tbsp'))).toBe(true);
  });

  it('is false when more than 1 of the chosen unit is left', () => {
    expect(decreaseRemovesPantryItem(shownIn('flour', 0.125, 'cup', 'tbsp'))).toBe(false);
  });

  it('counts in pantry units when shown in g', () => {
    expect(decreaseRemovesPantryItem(shownIn('cheddar cheese', 1.5, 'cup', 'g'))).toBe(false);
  });
});

describe('setPantryItemAmount', () => {
  it('sets the amount in the pantry unit', () => {
    expect(setPantryItemAmount([item('garlic', 2, 'clove')], 'garlic', 5.5, 'clove')).toEqual([item('garlic', 5.5, 'clove')]);
  });

  it('keeps an amount in another unit in the pantry unit, and remembers the unit chosen', () => {
    expect(setPantryItemAmount([item('flour', 1, 'cup')], 'flour', 32, 'tbsp')).toEqual([shownIn('flour', 2, 'cup', 'tbsp')]);
  });

  it('forgets the chosen unit when the pantry unit is picked again', () => {
    const [saved] = setPantryItemAmount([shownIn('flour', 2, 'cup', 'tbsp')], 'flour', 3, 'cup');
    expect(saved).toEqual(item('flour', 3, 'cup'));
    expect('shownUnit' in saved).toBe(false);
  });

  it('keeps the amount exact when an unchanged amount is saved back (4 oz shown in cups)', () => {
    const cups = shownPantryAmount(shownIn('mushroom', 4, 'oz', 'cup')).amount;
    expect(setPantryItemAmount([item('mushroom', 4, 'oz')], 'mushroom', cups, 'cup')[0].quantity).toBe(4);
  });

  it('sets the amount of an item with no unit', () => {
    expect(setPantryItemAmount([item('garlic', 2)], 'garlic', 4, null)).toEqual([item('garlic', 4)]);
  });

  it('leaves the other ingredients alone', () => {
    expect(setPantryItemAmount([item('egg', 2, 'each'), item('flour', 1, 'cup')], 'egg', 6, 'each')).toEqual([
      item('egg', 6, 'each'),
      item('flour', 1, 'cup'),
    ]);
  });

  it('changes nothing for a unit the ingredient cannot convert to', () => {
    expect(setPantryItemAmount([item('flour', 1, 'cup')], 'flour', 4, 'oz')).toEqual([item('flour', 1, 'cup')]);
  });
});

describe('pantryAmountLimit', () => {
  it('is the maximum in the pantry unit', () => {
    expect(pantryAmountLimit(item('flour', 1, 'cup'), 'cup')).toBe(MAX_PANTRY_QUANTITY);
  });

  it('is the maximum converted to another unit (99 cups = 1584 tbsp)', () => {
    expect(pantryAmountLimit(item('flour', 1, 'cup'), 'tbsp')).toBe(1584);
  });
});

describe('isValidPantryAmount', () => {
  const flour = item('flour', 1, 'cup');

  it('accepts an amount above 0 and up to the maximum', () => {
    expect(isValidPantryAmount(flour, 0.25, 'cup')).toBe(true);
  });

  it('accepts exactly the maximum in another unit', () => {
    expect(isValidPantryAmount(flour, 1584, 'tbsp')).toBe(true);
  });

  it.each([0, -1, Number.NaN])('rejects %p', (amount) => {
    expect(isValidPantryAmount(flour, amount, 'cup')).toBe(false);
  });

  it('rejects an amount over the maximum', () => {
    expect(isValidPantryAmount(flour, 1585, 'tbsp')).toBe(false);
  });
});

describe('stepDraftAmount', () => {
  it('adds the step', () => {
    expect(stepDraftAmount(2.5, 1)).toBe(3.5);
  });

  it('stops at 0', () => {
    expect(stepDraftAmount(3, -5)).toBe(0);
  });
});
