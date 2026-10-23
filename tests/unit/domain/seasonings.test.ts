import { groupSeasonings } from '../../../src/domain/seasonings';

describe('groupSeasonings', () => {
  it('puts the everyday seasonings first, then spices and herbs, then baking and extras', () => {
    expect(groupSeasonings(['vanilla extract', 'ground cumin', 'paprika'])).toEqual([
      { section: 'everyday', seasonings: ['paprika'] },
      { section: 'spicesAndHerbs', seasonings: ['ground cumin'] },
      { section: 'bakingAndExtras', seasonings: ['vanilla extract'] },
    ]);
  });

  it('sorts each section A to Z', () => {
    expect(groupSeasonings(['red pepper flakes', 'garlic powder', 'onion powder'])).toEqual([
      { section: 'everyday', seasonings: ['garlic powder', 'onion powder', 'red pepper flakes'] },
    ]);
  });

  it('leaves out a section with nothing in it', () => {
    expect(groupSeasonings(['basil'])).toEqual([{ section: 'spicesAndHerbs', seasonings: ['basil'] }]);
  });

  it('puts a seasoning it has no section for under spices and herbs', () => {
    expect(groupSeasonings(['sumac'])).toEqual([{ section: 'spicesAndHerbs', seasonings: ['sumac'] }]);
  });

  it('leaves out staples, which recipes assume you always have', () => {
    expect(groupSeasonings(['salt', 'black pepper', 'olive oil', 'paprika'])).toEqual([
      { section: 'everyday', seasonings: ['paprika'] },
    ]);
  });

  it('finds the section whatever the case of the name', () => {
    expect(groupSeasonings(['Vanilla Extract'])).toEqual([{ section: 'bakingAndExtras', seasonings: ['Vanilla Extract'] }]);
  });

  it('is empty when there are no seasonings', () => {
    expect(groupSeasonings([])).toEqual([]);
  });
});
