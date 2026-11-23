import {
  filterParts,
  formatHandsOnLimit,
  formatPeople,
  formatRecipeCount,
  formatShowRecipes,
  HANDS_ON_CHOICES,
  noRecipeFitsSegments,
} from '../../../src/ui/format/recipeFilters';

describe('formatHandsOnLimit', () => {
  it('says any time when there is no limit', () => {
    expect(formatHandsOnLimit(undefined)).toBe('Any time');
  });

  it('says a limit in minutes', () => {
    expect(formatHandsOnLimit(15)).toBe('15 min or less');
  });

  it('says a limit of an hour in hours', () => {
    expect(formatHandsOnLimit(60)).toBe('1 hr or less');
  });
});

describe('HANDS_ON_CHOICES', () => {
  it('offers 15, 30, 45 minutes, 1 hour and any, in that order', () => {
    expect(HANDS_ON_CHOICES.map(({ label }) => label)).toEqual(['15 min', '30 min', '45 min', '1 hr', 'Any']);
  });

  it('gives each choice its limit in minutes, and none for Any', () => {
    expect(HANDS_ON_CHOICES.map(({ minutes }) => minutes)).toEqual([15, 30, 45, 60, undefined]);
  });
});

describe('formatPeople', () => {
  it('says any when no number is chosen', () => {
    expect(formatPeople(undefined)).toBe('Any');
  });

  it('says one person', () => {
    expect(formatPeople(1)).toBe('1 person');
  });

  it('says several people', () => {
    expect(formatPeople(4)).toBe('4 people');
  });
});

describe('formatRecipeCount', () => {
  it.each([
    [0, '0 recipes'],
    [1, '1 recipe'],
    [8, '8 recipes'],
  ])('writes %i as "%s"', (count, text) => {
    expect(formatRecipeCount(count)).toBe(text);
  });
});

describe('formatShowRecipes', () => {
  it('says how many recipes the choices show', () => {
    expect(formatShowRecipes(8)).toBe('Show 8 recipes');
  });

  it('says one recipe', () => {
    expect(formatShowRecipes(1)).toBe('Show 1 recipe');
  });

  it('does not give a number while it is being counted', () => {
    expect(formatShowRecipes(null)).toBe('Show recipes');
  });
});

describe('filterParts', () => {
  it('is empty for an empty filter', () => {
    expect(filterParts({})).toEqual([]);
  });

  it('names the hands-on limit', () => {
    expect(filterParts({ maxActiveMinutes: 15 })).toEqual(['15 min hands-on']);
  });

  it('names the number of people', () => {
    expect(filterParts({ people: 4 })).toEqual(['4 people']);
  });

  it('names a serving range', () => {
    expect(filterParts({ servingRange: { min: 2, max: 4 } })).toEqual(['2–4 servings']);
  });

  it('names Meal Prep', () => {
    expect(filterParts({ mealPrepOnly: true })).toEqual(['Meal Prep']);
  });

  it('lists time, people, serving range, then Meal Prep', () => {
    expect(
      filterParts({ mealPrepOnly: true, servingRange: { min: 2, max: 4 }, people: 3, maxActiveMinutes: 30 }),
    ).toEqual(['30 min hands-on', '3 people', '2–4 servings', 'Meal Prep']);
  });
});

describe('noRecipeFitsSegments', () => {
  const text = (parts: string[]) => noRecipeFitsSegments(parts).map(({ text: piece }) => piece).join('');
  const bold = (parts: string[]) => noRecipeFitsSegments(parts).filter(({ bold: isBold }) => isBold).map(({ text: piece }) => piece);

  it('names one filter', () => {
    expect(text(['15 min hands-on'])).toBe('No recipe fits 15 min hands-on.');
  });

  it('names two filters together', () => {
    expect(text(['15 min hands-on', 'Meal Prep'])).toBe('No recipe fits 15 min hands-on and Meal Prep together.');
  });

  it('names three filters together', () => {
    expect(text(['15 min hands-on', '2 people', 'Meal Prep'])).toBe(
      'No recipe fits 15 min hands-on, 2 people and Meal Prep together.',
    );
  });

  it('puts the filters, and only them, in bold', () => {
    expect(bold(['15 min hands-on', 'Meal Prep'])).toEqual(['15 min hands-on', 'Meal Prep']);
  });
});
