import {
  cleanAmount,
  convertAmount,
  convertPantryAmount,
  isUncountableUnit,
  pantryUnitChoices,
  unitKind,
} from '../../../src/domain/unitConversions';

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

  describe('metric units (exact US definitions)', () => {
    it('converts teaspoons to millilitres (1 tsp = 4.92892159375 mL)', () => {
      const result = convertAmount('milk', 1, 'tsp', 'ml');
      expect(result?.amount).toBeCloseTo(4.92892159375, 10);
      expect(result?.approximate).toBe(false);
    });

    it('converts cups to litres (1 cup ≈ 0.2366 L)', () => {
      expect(convertAmount('milk', 1, 'cup', 'l')?.amount).toBeCloseTo(0.236588, 6);
    });

    it('converts ounces to grams (1 oz = 28.349523125 g)', () => {
      const result = convertAmount('cheese', 1, 'oz', 'g');
      expect(result?.amount).toBeCloseTo(28.349523125, 10);
      expect(result?.approximate).toBe(false);
    });

    it('converts pounds to kilograms (1 lb = 0.45359237 kg)', () => {
      expect(convertAmount('ground beef', 1, 'lb', 'kg')?.amount).toBeCloseTo(0.45359237, 10);
    });
  });

  describe('dozens of eggs', () => {
    it('converts a dozen to 12 each, exactly', () => {
      expect(convertAmount('egg', 1, 'dozen', 'each')).toEqual({ amount: 12, approximate: false });
    });
  });
});

describe('unitKind', () => {
  it.each(['tsp', 'tbsp', 'cup', 'pint', 'ml', 'l'])('says "%s" is a volume', (unit) => {
    expect(unitKind(unit)).toBe('volume');
  });

  it.each(['oz', 'lb', 'g', 'kg'])('says "%s" is a weight', (unit) => {
    expect(unitKind(unit)).toBe('weight');
  });

  it.each(['each', 'clove', 'can', 'slice', 'dozen'])('says "%s" is a count', (unit) => {
    expect(unitKind(unit)).toBe('count');
  });
});

describe('convertPantryAmount', () => {
  it('converts between units of the same kind, exactly', () => {
    expect(convertPantryAmount('flour', 2, 'cup', 'tbsp')).toEqual({ amount: 32, approximate: false });
  });

  it("uses an ingredient's factor forwards (2 oz of Cheddar ≈ 1/2 cup)", () => {
    expect(convertPantryAmount('cheddar cheese', 2, 'oz', 'cup')).toEqual({ amount: 0.5, approximate: true });
  });

  it("uses an ingredient's factor backwards (1/2 cup of Cheddar ≈ 2 oz)", () => {
    expect(convertPantryAmount('cheddar cheese', 0.5, 'cup', 'oz')).toEqual({ amount: 2, approximate: true });
  });

  it('chains a same-kind conversion after the factor (1 chicken breast ≈ 6 oz ≈ 170 g)', () => {
    expect(convertPantryAmount('chicken breast', 1, 'each', 'g')?.amount).toBeCloseTo(170.1, 1);
  });

  it('chains a same-kind conversion before the factor (8 oz of bacon is 1/2 lb ≈ 9 slices)', () => {
    expect(convertPantryAmount('bacon', 0.5, 'lb', 'slice')).toEqual({ amount: 9, approximate: true });
  });

  it('keeps a factor marked exact exact (2 dozen eggs = 24 each)', () => {
    expect(convertPantryAmount('egg', 2, 'dozen', 'each')).toEqual({ amount: 24, approximate: false });
  });

  it('comes back to the same amount after converting out and back, once cleaned', () => {
    const out = convertPantryAmount('mushroom', 4, 'oz', 'cup');
    expect(cleanAmount(convertPantryAmount('mushroom', out!.amount, 'cup', 'oz')!.amount)).toBe(4);
  });

  it('is null when no conversion links the two units', () => {
    expect(convertPantryAmount('flour', 1, 'cup', 'oz')).toBeNull();
  });

  it('finds the ingredient whatever its case', () => {
    expect(convertPantryAmount('Cheddar Cheese', 2, 'oz', 'cup')?.amount).toBe(0.5);
  });
});

describe('cleanAmount', () => {
  it('drops floating-point noise', () => {
    expect(cleanAmount(0.1 + 0.2)).toBe(0.3);
  });

  it('keeps a real fraction', () => {
    expect(cleanAmount(2.0625)).toBe(2.0625);
  });
});

describe('pantryUnitChoices', () => {
  const units = (ingredient: string, pantryUnit: string) =>
    pantryUnitChoices(ingredient, pantryUnit).map((choice) => choice.unit);

  it('offers the pantry unit first, then the other volumes, for a volume', () => {
    expect(units('all-purpose flour', 'cup')).toEqual(['cup', 'tsp', 'tbsp', 'ml', 'l']);
  });

  it('offers the pantry unit first, then the other weights, for a weight', () => {
    expect(units('beef sirloin', 'lb')).toEqual(['lb', 'oz', 'g', 'kg']);
  });

  it('adds weights when the ingredient has a factor to one', () => {
    expect(units('cheddar cheese', 'cup')).toEqual(['cup', 'tsp', 'tbsp', 'ml', 'l', 'oz', 'lb', 'g', 'kg']);
  });

  it('marks the weights reached through a factor as approximate', () => {
    const choices = pantryUnitChoices('cheddar cheese', 'cup');
    expect(choices.filter((choice) => choice.approximate).map((choice) => choice.unit)).toEqual(['oz', 'lb', 'g', 'kg']);
  });

  it('offers weights for a counted ingredient with a weight factor', () => {
    expect(units('chicken breast', 'each')).toEqual(['each', 'oz', 'lb', 'g', 'kg']);
  });

  it('leaves out volumes for whole produce, whose cup factors are for chopped food', () => {
    expect(units('onion', 'each')).toEqual(['each']);
  });

  it('leaves out volumes for a weight, even with a factor to one', () => {
    expect(units('mushroom', 'oz')).toEqual(['oz', 'lb', 'g', 'kg']);
  });

  it('offers dozens for eggs', () => {
    expect(units('egg', 'each')).toEqual(['each', 'dozen']);
  });

  it('offers only the pantry unit when nothing converts', () => {
    expect(units('black bean', 'can')).toEqual(['can']);
  });

  it('marks the pantry unit itself as exact', () => {
    expect(pantryUnitChoices('onion', 'each')).toEqual([{ unit: 'each', approximate: false }]);
  });
});
