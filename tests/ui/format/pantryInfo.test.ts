import {
  formatFindRecipesLabel,
  formatIngredientName,
  formatMatchedAgainst,
  formatOnHand,
  formatPantryUnit,
  formatSeasoningAdded,
  formatSeasoningName,
  formatSeasoningSection,
  formatStapleAssumed,
  formatTrayCount,
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

describe('formatPantryUnit', () => {
  it('uses the singular unit for a count of 1', () => {
    expect(formatPantryUnit(1, 'cup')).toBe('cup');
  });

  it('pluralizes the unit for a count above 1', () => {
    expect(formatPantryUnit(2, 'clove')).toBe('cloves');
  });

  it.each([
    ['loaf', 'loaves'],
    ['inch', 'inches'],
    ['tbsp', 'tbsp'],
    ['oz', 'oz'],
  ])('pluralizes "%s" as "%s"', (unit, expected) => {
    expect(formatPantryUnit(3, unit)).toBe(expected);
  });

  it('keeps "each" as "each" at any count, as the board shows "4 each"', () => {
    expect(formatPantryUnit(4, 'each')).toBe('each');
  });

  it('is null when the unit is not known', () => {
    expect(formatPantryUnit(2, null)).toBeNull();
  });
});

describe('formatSeasoningSection', () => {
  it.each([
    ['everyday', 'Everyday'],
    ['spicesAndHerbs', 'Spices & herbs'],
    ['bakingAndExtras', 'Baking & extras'],
  ] as const)('titles the "%s" section "%s"', (section, expected) => {
    expect(formatSeasoningSection(section)).toBe(expected);
  });
});

describe('formatSeasoningName', () => {
  it('capitalizes each word', () => {
    expect(formatSeasoningName('red pepper flakes', ['red pepper flakes'])).toBe('Red Pepper Flakes');
  });

  it('marks a fresh herb "Fresh" when the tray also has its dried version', () => {
    expect(formatSeasoningName('basil', ['basil', 'dried basil'])).toBe('Fresh Basil');
  });

  it('leaves a fresh herb plain when there is no dried version to tell it from', () => {
    expect(formatSeasoningName('parsley', ['parsley', 'dried basil'])).toBe('Parsley');
  });

  it('matches the dried version whatever its case', () => {
    expect(formatSeasoningName('thyme', ['Dried Thyme'])).toBe('Fresh Thyme');
  });
});

describe('formatOnHand', () => {
  it('counts the seasonings that are on', () => {
    expect(formatOnHand(4)).toBe('4 on hand');
  });
});

describe('formatTrayCount', () => {
  it('shows how many of the tray are on', () => {
    expect(formatTrayCount(4, 35)).toBe('4 of 35');
  });
});

describe('formatSeasoningAdded', () => {
  it('says the seasoning was switched on in the tray', () => {
    expect(formatSeasoningAdded('ground cumin')).toBe('Ground Cumin is on in Seasonings.');
  });
});

describe('formatStapleAssumed', () => {
  it('says recipes already assume the staple', () => {
    expect(formatStapleAssumed('olive oil')).toBe('Recipes already assume you have olive oil.');
  });
});
