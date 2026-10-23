import { pantryKindOf, type PantryCatalog } from '../../../src/domain/pantryCatalog';

const catalog: PantryCatalog = {
  units: { garlic: 'clove' },
  seasoningGroups: [{ section: 'everyday', seasonings: ['paprika'] }],
};

describe('pantryKindOf', () => {
  it('is a counted item with its pantry unit', () => {
    expect(pantryKindOf(catalog, 'garlic')).toEqual({ kind: 'count', unit: 'clove' });
  });

  it('is a seasoning when the tray has it', () => {
    expect(pantryKindOf(catalog, 'paprika')).toEqual({ kind: 'seasoning' });
  });

  it('is a staple when recipes assume you have it, even though the catalog leaves it out', () => {
    expect(pantryKindOf(catalog, 'olive oil')).toEqual({ kind: 'staple' });
  });

  it('finds the ingredient whatever its case or spacing', () => {
    expect(pantryKindOf(catalog, ' Paprika ')).toEqual({ kind: 'seasoning' });
  });

  it('is a counted item with no unit when the catalog does not know it', () => {
    expect(pantryKindOf(catalog, 'dragon fruit')).toEqual({ kind: 'count', unit: null });
  });
});
