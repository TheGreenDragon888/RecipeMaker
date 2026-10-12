import { formatMealTagline } from '../../../src/ui/format/mealTagline';

describe('formatMealTagline', () => {
  it.each([
    [5, "what's for breakfast?"],
    [10, "what's for breakfast?"],
    [11, "what's for lunch?"],
    [14, "what's for lunch?"],
    [15, 'time for a snack?'],
    [16, 'time for a snack?'],
    [17, "what's for dinner?"],
    [21, "what's for dinner?"],
    [22, 'midnight snack?'],
    [0, 'midnight snack?'],
    [4, 'midnight snack?'],
  ])('at hour %p says "%s"', (hour, expected) => {
    expect(formatMealTagline(hour)).toBe(expected);
  });
});
