import { getPantryCatalog } from '../../../src/services/getPantryCatalog';
import { InMemoryRecipeRepository } from '../../fakes/InMemoryRecipeRepository';

const repoWith = (...rows: [string, 'presence' | 'count', string | null][]) =>
  new InMemoryRecipeRepository([], {}, rows.map(([ingredient, tracking, defaultUnit]) => ({ ingredient, tracking, defaultUnit })));

describe('getPantryCatalog', () => {
  it('gives each counted ingredient its pantry unit, keyed by its name in lower case', async () => {
    const catalog = await getPantryCatalog(repoWith(['garlic', 'count', 'clove'], ['Cheddar cheese', 'count', 'cup']));
    expect(catalog.units).toEqual({ garlic: 'clove', 'cheddar cheese': 'cup' });
  });

  it('groups the on/off ingredients into the seasoning tray', async () => {
    const catalog = await getPantryCatalog(repoWith(['vanilla extract', 'presence', null], ['paprika', 'presence', null]));
    expect(catalog.seasoningGroups).toEqual([
      { section: 'everyday', seasonings: ['paprika'] },
      { section: 'bakingAndExtras', seasonings: ['vanilla extract'] },
    ]);
  });

  it('keeps counted ingredients out of the tray', async () => {
    const catalog = await getPantryCatalog(repoWith(['garlic', 'count', 'clove']));
    expect(catalog.seasoningGroups).toEqual([]);
  });

  it('keeps on/off ingredients out of the units', async () => {
    const catalog = await getPantryCatalog(repoWith(['paprika', 'presence', null]));
    expect(catalog.units).toEqual({});
  });

  it('leaves staples out of the tray', async () => {
    const catalog = await getPantryCatalog(repoWith(['salt', 'presence', null], ['olive oil', 'presence', null]));
    expect(catalog.seasoningGroups).toEqual([]);
  });
});
