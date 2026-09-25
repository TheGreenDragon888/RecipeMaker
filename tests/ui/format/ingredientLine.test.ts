import { formatIngredientLine, pluralizeName, pluralizeUnit } from '../../../src/ui/format/ingredientLine';
import { makeIngredient } from '../../fakes/InMemoryRecipeRepository';

describe('pluralizeName', () => {
  it.each([
    ['egg', 'eggs'],
    ['cherry', 'cherries'],
    ['turkey', 'turkeys'],
    ['peach', 'peaches'],
    ['radish', 'radishes'],
    ['tomato', 'tomatoes'],
    ['jalapeño', 'jalapeños'],
    ['rolled oats', 'rolled oats'],
    ['frozen peas', 'frozen peas'],
  ])('pluralizes "%s" as "%s"', (name, expected) => {
    expect(pluralizeName(name)).toBe(expected);
  });
});

describe('pluralizeUnit', () => {
  it.each([
    ['cup', 'cups'],
    ['clove', 'cloves'],
    ['can', 'cans'],
    ['slice', 'slices'],
    ['pinch', 'pinches'],
    ['dash', 'dashes'],
    ['bunch', 'bunches'],
    ['box', 'boxes'],
    ['loaf', 'loaves'],
    ['inch', 'inches'],
  ])('pluralizes "%s" as "%s"', (unit, expected) => {
    expect(pluralizeUnit(unit)).toBe(expected);
  });

  it.each(['tsp', 'tbsp', 'oz', 'lb'])('leaves the abbreviation "%s" unchanged', (unit) => {
    expect(pluralizeUnit(unit)).toBe(unit);
  });
});

describe('formatIngredientLine', () => {
  it('shows a count of "each" items with a plural name and no unit word', () => {
    expect(formatIngredientLine(makeIngredient({ ingredient: 'egg', quantityMin: 2, quantityMax: 2, unit: 'each' }))).toBe('2 eggs');
  });

  it('keeps a single "each" item singular', () => {
    expect(formatIngredientLine(makeIngredient({ ingredient: 'avocado', quantityMin: 1, quantityMax: 1, unit: 'each' }))).toBe(
      '1 avocado',
    );
  });

  it('pluralizes the name after a container unit even for a quantity of 1', () => {
    const line = makeIngredient({ ingredient: 'chickpea', quantityMin: 1, quantityMax: 1, unit: 'can', preparation: '15 oz, rinsed' });
    expect(formatIngredientLine(line)).toBe('1 can chickpeas, 15 oz, rinsed');
  });

  it('pluralizes the unit but keeps the name singular for other units', () => {
    const line = makeIngredient({ ingredient: 'garlic', quantityMin: 3, quantityMax: 3, unit: 'clove', preparation: 'minced' });
    expect(formatIngredientLine(line)).toBe('3 cloves garlic, minced');
  });

  it('keeps the unit singular for a quantity of 1', () => {
    expect(formatIngredientLine(makeIngredient({ ingredient: 'milk', quantityMin: 1, quantityMax: 1, unit: 'cup' }))).toBe(
      '1 cup milk',
    );
  });

  it('pluralizes the unit when the top of a range is above 1', () => {
    expect(formatIngredientLine(makeIngredient({ ingredient: 'olive oil', quantityMin: 1, quantityMax: 2, unit: 'tbsp' }))).toBe(
      '1–2 tbsp olive oil',
    );
  });

  it('shows fractional quantities as fractions', () => {
    expect(formatIngredientLine(makeIngredient({ ingredient: 'mayonnaise', quantityMin: 0.333, quantityMax: 0.333, unit: 'cup' }))).toBe(
      '1/3 cup mayonnaise',
    );
  });

  it('shows "to taste" after the name', () => {
    expect(formatIngredientLine(makeIngredient({ ingredient: 'salt', quantityMin: null, quantityMax: null, unit: 'to taste' }))).toBe(
      'salt, to taste',
    );
  });

  it('shows "as needed" after the name and preparation', () => {
    const line = makeIngredient({ ingredient: 'vegetable oil', quantityMin: null, quantityMax: null, unit: 'as needed', preparation: 'for frying' });
    expect(formatIngredientLine(line)).toBe('vegetable oil, for frying, as needed');
  });

  it('marks optional ingredients', () => {
    const line = makeIngredient({ ingredient: 'cilantro', quantityMin: 1, quantityMax: 1, unit: 'handful', isOptional: true });
    expect(formatIngredientLine(line)).toBe('1 handful cilantro (optional)');
  });

  it('shows the substitute after a dash', () => {
    const line = makeIngredient({ ingredient: 'ground turkey', quantityMin: 1, quantityMax: 1, unit: 'lb', substitute: 'ground beef' });
    expect(formatIngredientLine(line)).toBe('1 lb ground turkey — or ground beef');
  });
});
