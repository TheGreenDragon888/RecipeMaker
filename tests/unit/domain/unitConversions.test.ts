import { convertAmount, isUncountableUnit } from '../../../src/domain/unitConversions';

describe('isUncountableUnit', () => {
  it.each(['to taste', 'as needed', 'pinch', 'dash', 'handful', 'batch'])('is true for "%s"', (unit) => {
    expect(isUncountableUnit(unit)).toBe(true);
  });

  it.each(['cup', 'each', 'clove', 'can'])('is false for "%s"', (unit) => {
    expect(isUncountableUnit(unit)).toBe(false);
  });
});

describe('convertAmount', () => {
  describe('the same unit', () => {
    it('returns the amount unchanged and exact', () => {
      expect(convertAmount('flour', 2, 'cup', 'cup')).toEqual({ amount: 2, approximate: false });
    });
  });

  describe('volume units, the same for every ingredient', () => {
    it('converts tablespoons to teaspoons (1 tbsp = 3 tsp)', () => {
      expect(convertAmount('soy sauce', 2, 'tbsp', 'tsp')).toEqual({ amount: 6, approximate: false });
    });

    it('converts cups to tablespoons (1 cup = 16 tbsp)', () => {
      expect(convertAmount('ketchup', 0.75, 'cup', 'tbsp')).toEqual({ amount: 12, approximate: false });
    });

    it('converts teaspoons to cups (48 tsp = 1 cup)', () => {
      expect(convertAmount('granulated sugar', 12, 'tsp', 'cup')).toEqual({ amount: 0.25, approximate: false });
    });

    it('converts pints to cups (1 pint = 2 cups)', () => {
      expect(convertAmount('grape tomato', 1, 'pint', 'cup')).toEqual({ amount: 2, approximate: false });
    });
  });

  describe('weight units, the same for every ingredient', () => {
    it('converts pounds to ounces (1 lb = 16 oz)', () => {
      expect(convertAmount('cheese', 0.5, 'lb', 'oz')).toEqual({ amount: 8, approximate: false });
    });

    it('converts ounces to pounds', () => {
      expect(convertAmount('ground beef', 24, 'oz', 'lb')).toEqual({ amount: 1.5, approximate: false });
    });
  });

  describe('factors for one ingredient', () => {
    it('converts with the ingredient\'s factor and marks it approximate (1 tbsp minced garlic ≈ 3 cloves)', () => {
      expect(convertAmount('garlic', 2, 'tbsp', 'clove')).toEqual({ amount: 6, approximate: true });
    });

    it('finds the ingredient whatever its case or spacing', () => {
      expect(convertAmount(' Cheddar  cheese', 2, 'oz', 'cup')).toEqual({ amount: 0.5, approximate: true });
    });

    it('marks a factor exact when it holds by definition (a 16 oz package is 1 lb)', () => {
      expect(convertAmount('fettuccine', 1, 'package', 'lb')).toEqual({ amount: 1, approximate: false });
    });

    it('is null when the ingredient has a factor from that unit, but to a different unit', () => {
      expect(convertAmount('garlic', 1, 'tbsp', 'oz')).toBeNull();
    });
  });

  describe('no conversion', () => {
    it('is null between a volume and a weight when the ingredient has no factor', () => {
      expect(convertAmount('flour', 1, 'cup', 'oz')).toBeNull();
    });

    it('is null for an amount that cannot be counted, like "to taste"', () => {
      expect(convertAmount('salt', 1, 'to taste', 'tsp')).toBeNull();
    });
  });
});
