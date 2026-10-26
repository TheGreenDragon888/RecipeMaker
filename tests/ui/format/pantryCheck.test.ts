import type { ShownAmount } from '../../../src/domain/pantry';
import type { PantryCheck } from '../../../src/domain/pantryCheck';
import {
  checkMark,
  formatCheckDetail,
  formatCheckLabel,
  formatCheckNote,
  formatLegendLabel,
  legendMarks,
} from '../../../src/ui/format/pantryCheck';

const amount = (value: number, unit: string | null, approximate = false): ShownAmount => ({ amount: value, unit, approximate });
const have = (value: number, unit: string | null, approximate = false): PantryCheck => ({
  status: 'have',
  have: amount(value, unit, approximate),
});
const halfPoundShort: PantryCheck = { status: 'notEnough', have: amount(0.5, 'lb'), short: amount(0.5, 'lb') };
const tamari: PantryCheck = { status: 'swap', substitute: 'tamari', have: amount(4, 'tbsp') };
const cookingSpray: PantryCheck = { status: 'swap', substitute: 'cooking spray', have: null };

describe('formatCheckNote', () => {
  it('says how much is on hand of an ingredient the pantry has', () => {
    expect(formatCheckNote(have(6, 'clove'))).toBe('have 6 cloves');
  });

  it('leaves the unit out for things counted one at a time, as the recipe lines do', () => {
    expect(formatCheckNote(have(2, 'each'))).toBe('have 2');
  });

  it('writes a part as a kitchen fraction', () => {
    expect(formatCheckNote(have(0.5, 'cup'))).toBe('have 1/2 cup');
  });

  it('marks an estimated amount with ≈', () => {
    expect(formatCheckNote(have(2, 'tbsp', true))).toBe('have ≈ 2 tbsp');
  });

  it('gives the amount alone when its unit is not known', () => {
    expect(formatCheckNote(have(1, null))).toBe('have 1');
  });

  it('says "staple" for a staple', () => {
    expect(formatCheckNote({ status: 'staple' })).toBe('staple');
  });

  it('has no note for a seasoning, which has no amount', () => {
    expect(formatCheckNote({ status: 'have', have: null })).toBeNull();
  });

  it('has no note for a line that is short, swapped or missing, which say it underneath instead', () => {
    expect([halfPoundShort, tamari, { status: 'missing' } as const].map(formatCheckNote)).toEqual([null, null, null]);
  });
});

describe('formatCheckDetail', () => {
  it('says how much more is needed of an ingredient that is short', () => {
    expect(formatCheckDetail(halfPoundShort)).toBe('Not enough — have 1/2 lb, need 1/2 lb more');
  });

  it('names the swap and how much of it is on hand', () => {
    expect(formatCheckDetail(tamari)).toBe('Swap: use tamari — you have 4 tbsp');
  });

  it('names the swap alone when there is no amount to give', () => {
    expect(formatCheckDetail(cookingSpray)).toBe('Swap: use cooking spray');
  });

  it('says a missing ingredient is not in the pantry', () => {
    expect(formatCheckDetail({ status: 'missing' })).toBe('Not in your pantry');
  });

  it('has nothing to add under an ingredient on hand', () => {
    expect(formatCheckDetail(have(6, 'clove'))).toBeNull();
  });
});

describe('formatCheckLabel', () => {
  it('tells screen readers an ingredient is on hand, and how much', () => {
    expect(formatCheckLabel(have(6, 'clove'))).toBe('In your pantry, have 6 cloves');
  });

  it('tells screen readers a seasoning is on hand', () => {
    expect(formatCheckLabel({ status: 'have', have: null })).toBe('In your pantry');
  });

  it('tells screen readers a staple is assumed on hand', () => {
    expect(formatCheckLabel({ status: 'staple' })).toBe('Kitchen staple, assumed on hand');
  });

  it('reads out the line underneath for a line that is short, swapped or missing', () => {
    expect([halfPoundShort, tamari, { status: 'missing' } as const].map(formatCheckLabel)).toEqual([
      'Not enough — have 1/2 lb, need 1/2 lb more',
      'Swap: use tamari — you have 4 tbsp',
      'Not in your pantry',
    ]);
  });

  it('tells screen readers an optional ingredient is not in the pantry', () => {
    expect(formatCheckLabel({ status: 'optional' })).toBe('Not in your pantry');
  });
});

describe('checkMark', () => {
  it('gives each check the circle it is drawn with, a staple sharing the green check', () => {
    expect([have(1, 'clove'), { status: 'staple' } as const, halfPoundShort, tamari, { status: 'missing' } as const].map(checkMark)).toEqual([
      'have',
      'have',
      'notEnough',
      'swap',
      'missing',
    ]);
  });

  it('gives no circle to an optional line the pantry lacks', () => {
    expect(checkMark({ status: 'optional' })).toBeNull();
  });
});

describe('legendMarks', () => {
  it('lists the circles the checks use, once each, in the order have, swap, not enough, missing', () => {
    expect(legendMarks([{ status: 'missing' }, have(1, 'clove'), tamari, { status: 'staple' }])).toEqual(['have', 'swap', 'missing']);
  });

  it('is empty when no line has a circle', () => {
    expect(legendMarks([{ status: 'optional' }])).toEqual([]);
  });
});

describe('formatLegendLabel', () => {
  it('names each circle as the board does', () => {
    expect((['have', 'swap', 'notEnough', 'missing'] as const).map(formatLegendLabel)).toEqual([
      'Have',
      'Swap',
      'Not enough',
      'Missing',
    ]);
  });
});
