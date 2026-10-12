import { pantryFromParam, pantryToParam, recipeHref, recipeIdFromParam } from '../../../src/ui/navigation/routeParams';

describe('pantryToParam and pantryFromParam', () => {
  it('round-trips a pantry list', () => {
    const pantry = ['tomato', 'green onion', 'jalapeño'];
    expect(pantryFromParam(pantryToParam(pantry))).toEqual(pantry);
  });

  it('round-trips names that contain commas', () => {
    const pantry = ['salt, kosher', 'olive oil'];
    expect(pantryFromParam(pantryToParam(pantry))).toEqual(pantry);
  });
});

describe('pantryFromParam', () => {
  it('returns an empty list when the param is missing', () => {
    expect(pantryFromParam(undefined)).toEqual([]);
  });

  it('returns an empty list when the param is repeated', () => {
    expect(pantryFromParam(['["tomato"]', '["egg"]'])).toEqual([]);
  });

  it('returns an empty list when the param is not valid JSON', () => {
    expect(pantryFromParam('["tomato"')).toEqual([]);
  });

  it('returns an empty list when the JSON is not a list', () => {
    expect(pantryFromParam('"tomato"')).toEqual([]);
  });

  it('returns an empty list when the list holds something other than text', () => {
    expect(pantryFromParam('["tomato", 3]')).toEqual([]);
  });
});

describe('recipeIdFromParam', () => {
  it('reads a whole-number id', () => {
    expect(recipeIdFromParam('42')).toBe(42);
  });

  it('returns null when the param is missing', () => {
    expect(recipeIdFromParam(undefined)).toBeNull();
  });

  it('returns null when the param is repeated', () => {
    expect(recipeIdFromParam(['1', '2'])).toBeNull();
  });

  it.each(['', 'abc', '4.5', '-3', ' 42'])('returns null for %p', (value) => {
    expect(recipeIdFromParam(value)).toBeNull();
  });
});

describe('recipeHref', () => {
  it('links to the recipe route with the id as a string', () => {
    expect(recipeHref(42)).toEqual({ pathname: '/recipe/[id]', params: { id: '42' } });
  });

  it('round-trips the id through recipeIdFromParam', () => {
    expect(recipeIdFromParam(recipeHref(7).params.id)).toBe(7);
  });
});
