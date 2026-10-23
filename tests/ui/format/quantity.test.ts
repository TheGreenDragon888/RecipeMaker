import { formatAmount, formatKitchenAmount, formatQuantity } from '../../../src/ui/format/quantity';

describe('formatKitchenAmount', () => {
  it.each([
    [2, '2'],
    [1.5, '1 1/2'],
    [0.333333, '1/3'],
    [2.0625, '2.06'],
    [31.9999, '32'],
    [0.3125, '0.31'],
    [6.1875, '6.19'],
  ])('shows %p as "%s"', (value, expected) => {
    expect(formatKitchenAmount(value)).toBe(expected);
  });

  it('never says "about": a value near a fraction shows as a decimal', () => {
    expect(formatKitchenAmount(0.458)).toBe('0.46');
  });

  it('shows a tiny amount instead of rounding it to 0', () => {
    expect(formatKitchenAmount(0.001)).toBe('0.001');
  });
});

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
