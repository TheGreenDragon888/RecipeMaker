import { addPantryItem } from '../../../src/domain/pantry';

describe('addPantryItem', () => {
  it('adds a new ingredient to the end of the pantry', () => {
    expect(addPantryItem(['egg'], 'tomato')).toEqual(['egg', 'tomato']);
  });

  it('trims spaces around the typed ingredient', () => {
    expect(addPantryItem([], '  tomato ')).toEqual(['tomato']);
  });

  it('ignores blank text', () => {
    expect(addPantryItem(['egg'], '   ')).toEqual(['egg']);
  });

  it('ignores an ingredient already in the pantry, whatever its case or spacing', () => {
    expect(addPantryItem(['Green  Onion'], ' green onion')).toEqual(['Green  Onion']);
  });

  it('keeps different names for the same ingredient as separate items', () => {
    expect(addPantryItem(['scallions'], 'green onion')).toEqual(['scallions', 'green onion']);
  });

  it('does not change the original pantry list', () => {
    const pantry = ['egg'];
    addPantryItem(pantry, 'tomato');
    expect(pantry).toEqual(['egg']);
  });
});
