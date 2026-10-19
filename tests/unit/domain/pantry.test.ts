import {
  addPantryItem,
  canIncreasePantryQuantity,
  decreasePantryQuantity,
  decreaseRemovesPantryItem,
  increasePantryQuantity,
  MAX_PANTRY_QUANTITY,
  type PantryItem,
} from '../../../src/domain/pantry';

const item = (name: string, quantity = 1): PantryItem => ({ name, quantity });

describe('addPantryItem', () => {
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
