import type { PantryCatalog } from '../../../src/domain/pantryCatalog';
import type { PantryItem } from '../../../src/domain/pantry';
import { restoreSavedPantry } from '../../../src/domain/savedPantry';

/** The recipe data as it is now: what each ingredient is counted in, and the seasoning tray. */
const catalog: PantryCatalog = {
  units: { garlic: 'clove', milk: 'cup', 'dragon fruit': 'each', rice: 'cup' },
  seasoningGroups: [{ section: 'everyday', seasonings: ['paprika', 'cumin'] }],
};

const item = (name: string, quantity: number, unit: string | null, shownUnit?: string): PantryItem =>
  shownUnit === undefined ? { name, quantity, unit } : { name, quantity, unit, shownUnit };

describe('restoreSavedPantry', () => {
  it("keeps a saved counted item whose pantry unit hasn't changed", () => {
    const restored = restoreSavedPantry({ items: [item('garlic', 3, 'clove')], seasoningsOn: [] }, catalog);
    expect(restored.pantry).toEqual([item('garlic', 3, 'clove')]);
  });

  it('keeps the saved order of the list', () => {
    const items = [item('milk', 2, 'cup'), item('garlic', 3, 'clove')];
    expect(restoreSavedPantry({ items, seasoningsOn: [] }, catalog).pantry).toEqual(items);
  });

  it('keeps a seasoning that is still in the tray', () => {
    expect(restoreSavedPantry({ items: [], seasoningsOn: ['paprika'] }, catalog).seasoningsOn).toEqual(['paprika']);
  });

  describe('after a data update changes how an ingredient is kept', () => {
    it('moves a counted item that is now a seasoning into the seasonings that are on', () => {
      const restored = restoreSavedPantry({ items: [item('cumin', 2, 'tsp')], seasoningsOn: ['paprika'] }, catalog);
      expect(restored).toEqual({ pantry: [], seasoningsOn: ['paprika', 'cumin'], changes: expect.anything() });
    });

    it('adds a seasoning that is now counted to the end of the list, at 1 of its pantry unit', () => {
      const restored = restoreSavedPantry({ items: [item('milk', 2, 'cup')], seasoningsOn: ['garlic'] }, catalog);
      expect(restored).toEqual({
        pantry: [item('milk', 2, 'cup'), item('garlic', 1, 'clove')],
        seasoningsOn: [],
        changes: expect.anything(),
      });
    });

    it('drops an item that is now a staple', () => {
      expect(restoreSavedPantry({ items: [item('olive oil', 2, 'cup')], seasoningsOn: [] }, catalog).pantry).toEqual([]);
    });

    it('drops a seasoning that is now a staple', () => {
      expect(restoreSavedPantry({ items: [], seasoningsOn: ['salt'] }, catalog).seasoningsOn).toEqual([]);
    });

    it('drops an item the recipe data no longer has', () => {
      expect(restoreSavedPantry({ items: [item('ale', 2, 'cup')], seasoningsOn: [] }, catalog).pantry).toEqual([]);
    });

    it('drops a seasoning the recipe data no longer has', () => {
      expect(restoreSavedPantry({ items: [], seasoningsOn: ['sumac'] }, catalog).seasoningsOn).toEqual([]);
    });
  });

  describe('units', () => {
    const restoredItem = (saved: PantryItem) => restoreSavedPantry({ items: [saved], seasoningsOn: [] }, catalog).pantry;

    it("converts the amount when the ingredient's pantry unit has changed", () => {
      expect(restoredItem(item('rice', 32, 'tbsp'))).toEqual([item('rice', 2, 'cup')]);
    });

    it('caps a converted amount at 99 of the new pantry unit', () => {
      expect(restoredItem(item('rice', 60, 'pint'))).toEqual([item('rice', 99, 'cup')]);
    });

    it("resets the amount to 1 when the old unit doesn't convert to the new one", () => {
      expect(restoredItem(item('dragon fruit', 3, 'cup'))).toEqual([item('dragon fruit', 1, 'each')]);
    });

    it("gives an item saved without a unit the catalog's unit, keeping its amount", () => {
      expect(restoredItem(item('garlic', 3, null))).toEqual([item('garlic', 3, 'clove')]);
    });

    it('keeps a shown unit the item can still be shown in', () => {
      expect(restoredItem(item('milk', 2, 'cup', 'tbsp'))).toEqual([item('milk', 2, 'cup', 'tbsp')]);
    });

    it("drops a shown unit the item can't be shown in", () => {
      expect(restoredItem(item('milk', 2, 'cup', 'dozen'))).toEqual([item('milk', 2, 'cup')]);
    });

    it('drops a shown unit that has become the pantry unit', () => {
      expect(restoredItem(item('rice', 32, 'tbsp', 'cup'))).toEqual([item('rice', 2, 'cup')]);
    });
  });

  describe('bad saved rows', () => {
    const empty = { pantry: [], seasoningsOn: [], changes: [] };

    it('quietly drops an item whose amount is 0 or less', () => {
      expect(restoreSavedPantry({ items: [item('garlic', 0, 'clove')], seasoningsOn: [] }, catalog)).toEqual(empty);
    });

    it("quietly drops an item whose amount isn't a number", () => {
      expect(restoreSavedPantry({ items: [item('garlic', NaN, 'clove')], seasoningsOn: [] }, catalog)).toEqual(empty);
    });

    it('caps an amount over 99 at 99', () => {
      const restored = restoreSavedPantry({ items: [item('garlic', 140, 'clove')], seasoningsOn: [] }, catalog);
      expect(restored.pantry).toEqual([item('garlic', 99, 'clove')]);
    });

    it('keeps only the first of two items with the same name, ignoring case', () => {
      const items = [item('garlic', 3, 'clove'), item('Garlic', 5, 'clove')];
      expect(restoreSavedPantry({ items, seasoningsOn: [] }, catalog).pantry).toEqual([item('garlic', 3, 'clove')]);
    });

    it('keeps only one of two seasonings with the same name', () => {
      expect(restoreSavedPantry({ items: [], seasoningsOn: ['paprika', 'Paprika'] }, catalog).seasoningsOn).toEqual([
        'paprika',
      ]);
    });
  });

  describe('changes the user should hear about', () => {
    const changesFor = (items: PantryItem[], seasoningsOn: string[]) =>
      restoreSavedPantry({ items, seasoningsOn }, catalog).changes;

    it('reports no changes when the saved pantry still fits the recipe data', () => {
      expect(changesFor([item('garlic', 3, 'clove')], ['paprika'])).toEqual([]);
    });

    it('reports an item the recipe data no longer has as removed', () => {
      expect(changesFor([item('ale', 2, 'cup')], [])).toEqual([{ kind: 'removed', name: 'ale' }]);
    });

    it('reports a seasoning the recipe data no longer has as removed', () => {
      expect(changesFor([], ['sumac'])).toEqual([{ kind: 'removed', name: 'sumac' }]);
    });

    it('reports an item that moved to the seasonings', () => {
      expect(changesFor([item('cumin', 2, 'tsp')], [])).toEqual([{ kind: 'movedToSeasonings', name: 'cumin' }]);
    });

    it('reports a seasoning that moved to the list', () => {
      expect(changesFor([], ['garlic'])).toEqual([{ kind: 'movedToList', name: 'garlic' }]);
    });

    it("doesn't report a staple it dropped, since matching already assumes it", () => {
      expect(changesFor([item('olive oil', 2, 'cup')], ['salt'])).toEqual([]);
    });

    it('reports the list first, then the seasonings, each in saved order', () => {
      expect(changesFor([item('ale', 1, 'cup'), item('cumin', 1, 'tsp')], ['sumac'])).toEqual([
        { kind: 'removed', name: 'ale' },
        { kind: 'movedToSeasonings', name: 'cumin' },
        { kind: 'removed', name: 'sumac' },
      ]);
    });
  });
});
