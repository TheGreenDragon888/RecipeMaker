import { formatAmount, formatQuantity } from '../../../src/ui/format/quantity';

describe('formatAmount', () => {
  it.each([
    [2, '2'],
    [0.5, '1/2'],
    [0.333, '1/3'],
    [0.667, '2/3'],
    [0.25, '1/4'],
    [0.125, '1/8'],
    [1.5, '1 1/2'],
    [1.333, '1 1/3'],
    [2.75, '2 3/4'],
  ])('shows %p as the fraction "%s"', (value, expected) => {
    expect(formatAmount(value)).toBe(expected);
  });

  it('snaps values within 0.02 of a fraction', () => {
    expect(formatAmount(0.49)).toBe('1/2');
  });

  it('rounds up to the next whole number when the fraction snaps to 1', () => {
    expect(formatAmount(1.99)).toBe('2');
  });

  it('prefixes "about" when a value is near but not within 0.02 of a fraction', () => {
    expect(formatAmount(0.458)).toBe('about 1/2');
  });

  it('shows a rounded decimal when no fraction is near', () => {
    expect(formatAmount(0.06)).toBe('0.06');
  });

  it('shows a tiny amount as a decimal instead of rounding it away to nothing', () => {
    expect(formatAmount(0.01)).toBe('0.01');
  });
});

describe('formatQuantity', () => {
  it('shows a single amount when min equals max', () => {
    expect(formatQuantity(2, 2)).toBe('2');
  });

  it('shows a range with an en dash when min differs from max', () => {
    expect(formatQuantity(3, 4)).toBe('3–4');
  });

  it('shows nothing when there is no quantity', () => {
    expect(formatQuantity(null, null)).toBe('');
  });
});
