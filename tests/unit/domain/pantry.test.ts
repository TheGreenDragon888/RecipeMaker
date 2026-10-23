import {
  addPantryItem,
  canIncreasePantryQuantity,
  decreasePantryQuantity,
  decreaseRemovesPantryItem,
  increasePantryQuantity,
  MAX_PANTRY_QUANTITY,
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
