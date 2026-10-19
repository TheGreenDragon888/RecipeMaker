import {
  formatFindRecipesLabel,
  formatIngredientName,
  formatMatchedAgainst,
  formatUnknownIngredient,
} from '../../../src/ui/format/pantryInfo';

describe('formatFindRecipesLabel', () => {
  it('uses the singular for one ingredient', () => {
    expect(formatFindRecipesLabel(1)).toBe('Find recipes with 1 ingredient');
  });

  it('uses the plural for several ingredients', () => {
    expect(formatFindRecipesLabel(8)).toBe('Find recipes with 8 ingredients');
  });
});

describe('formatMatchedAgainst', () => {
  it('uses the singular for one pantry ingredient', () => {
    expect(formatMatchedAgainst(1)).toBe('Matched against your 1 pantry ingredient');
  });

  it('uses the plural for several pantry ingredients', () => {
    expect(formatMatchedAgainst(8)).toBe('Matched against your 8 pantry ingredients');
  });
});

describe('formatUnknownIngredient', () => {
  it('quotes the typed text without its surrounding spaces', () => {
    expect(formatUnknownIngredient('  dragonfruit ')).toBe('“dragonfruit” isn’t in our ingredient list.');
  });
});

describe('formatIngredientName', () => {
  it('capitalizes each word', () => {
    expect(formatIngredientName('green onion')).toBe('Green Onion');
  });

  it('capitalizes only the start of a hyphenated word', () => {
    expect(formatIngredientName('all-purpose flour')).toBe('All-purpose Flour');
  });

  it('keeps capitals the name already has', () => {
    expect(formatIngredientName('American cheese')).toBe('American Cheese');
  });
});
