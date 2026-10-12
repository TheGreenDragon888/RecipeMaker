import { formatIngredientsOnHand } from '../../../src/ui/format/matchInfo';

describe('formatIngredientsOnHand', () => {
  it('shows owned out of needed ingredients', () => {
    expect(formatIngredientsOnHand({ haveCount: 3, neededCount: 5 })).toBe('3/5 ingredients on hand');
  });

  it('uses the singular when the recipe needs one ingredient', () => {
    expect(formatIngredientsOnHand({ haveCount: 1, neededCount: 1 })).toBe('1/1 ingredient on hand');
  });
});
