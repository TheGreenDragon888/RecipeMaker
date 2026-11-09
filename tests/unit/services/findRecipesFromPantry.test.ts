import { findRecipesFromPantry } from '../../../src/services/findRecipesFromPantry';
import { InMemoryRecipeRepository, type FakeRecipe } from '../../fakes/InMemoryRecipeRepository';

const names = (ms: { recipe: { name: string } }[]) => ms.map((m) => m.recipe.name);

describe('findRecipesFromPantry', () => {
  it('counts needed, owned and missing ingredients for a recipe', async () => {
    const repo = new InMemoryRecipeRepository([
      { id: 1, name: 'Omelet', ingredients: [{ ingredient: 'egg' }, { ingredient: 'cheese' }, { ingredient: 'ham' }] },
    ]);
    const [match] = await findRecipesFromPantry(repo, ['egg', 'cheese']);
    expect(match).toEqual(expect.objectContaining({ neededCount: 3, haveCount: 2, missingCount: 1 }));
  });

  it('resolves pantry items through aliases', async () => {
    const repo = new InMemoryRecipeRepository(
      [{ id: 1, name: 'Omelet', ingredients: [{ ingredient: 'egg' }] }],
      { eggs: 'egg' },
    );
    const [match] = await findRecipesFromPantry(repo, ['eggs']);
    expect(match.haveCount).toBe(1);
  });

  it('matches pantry items regardless of case and extra whitespace', async () => {
    const repo = new InMemoryRecipeRepository([
      { id: 1, name: 'Pasta', ingredients: [{ ingredient: 'Parmesan cheese' }] },
    ]);
    const [match] = await findRecipesFromPantry(repo, ['  parmesan   CHEESE ']);
    expect(match.missingCount).toBe(0);
  });

  it('does not count optional ingredients as needed', async () => {
    const repo = new InMemoryRecipeRepository([
      { id: 1, name: 'Noodles', ingredients: [{ ingredient: 'noodle' }, { ingredient: 'cilantro', isOptional: true }] },
    ]);
    const [match] = await findRecipesFromPantry(repo, ['noodle']);
    expect(match.neededCount).toBe(1);
  });

  it('does not count staples such as salt and olive oil as needed', async () => {
    const repo = new InMemoryRecipeRepository([
      { id: 1, name: 'Toast', ingredients: [{ ingredient: 'bread' }, { ingredient: 'salt' }, { ingredient: 'olive oil' }] },
    ]);
    const [match] = await findRecipesFromPantry(repo, ['bread']);
    expect(match.neededCount).toBe(1);
  });

  it('counts an ingredient listed on several lines only once', async () => {
    const repo = new InMemoryRecipeRepository([
      { id: 1, name: 'Mug Cake', ingredients: [{ ingredient: 'butter' }, { ingredient: 'butter' }, { ingredient: 'flour' }] },
    ]);
    const [match] = await findRecipesFromPantry(repo, ['butter']);
    expect(match).toEqual(expect.objectContaining({ neededCount: 2, haveCount: 1 }));
  });

  it('leaves out recipes that use none of the pantry items', async () => {
    const repo = new InMemoryRecipeRepository([
      { id: 1, name: 'Toast', ingredients: [{ ingredient: 'bread' }] },
      { id: 2, name: 'Salad', ingredients: [{ ingredient: 'lettuce' }] },
    ]);
    expect(names(await findRecipesFromPantry(repo, ['bread']))).toEqual(['Toast']);
  });

  it('returns an empty list for an empty pantry', async () => {
    const repo = new InMemoryRecipeRepository([{ id: 1, ingredients: [{ ingredient: 'bread' }] }]);
    expect(await findRecipesFromPantry(repo, [])).toEqual([]);
  });

  it('ranks recipes with more matching ingredients first, even if more are missing', async () => {
    const repo = new InMemoryRecipeRepository([
      { id: 1, name: 'Zebra', ingredients: [{ ingredient: 'egg' }, { ingredient: 'milk' }, { ingredient: 'x' }] },
      { id: 2, name: 'Alpha', ingredients: [{ ingredient: 'egg' }] },
      { id: 3, name: 'Beta', ingredients: [{ ingredient: 'egg' }, { ingredient: 'milk' }, { ingredient: 'y' }] },
    ]);
    expect(names(await findRecipesFromPantry(repo, ['egg', 'milk']))).toEqual(['Beta', 'Zebra', 'Alpha']);
  });

  it('breaks ties on matching ingredient count and matched fraction alphabetically', async () => {
    const repo = new InMemoryRecipeRepository([
      { id: 1, name: 'Zebra', ingredients: [{ ingredient: 'egg' }, { ingredient: 'x' }] },
      { id: 2, name: 'Alpha', ingredients: [{ ingredient: 'egg' }, { ingredient: 'y' }] },
    ]);
    expect(names(await findRecipesFromPantry(repo, ['egg']))).toEqual(['Alpha', 'Zebra']);
  });

  it('ranks the recipe with the larger matched fraction first when matching counts tie', async () => {
    const repo = new InMemoryRecipeRepository([
      { id: 1, name: 'Seven Ingredients', ingredients: [{ ingredient: 'egg' }, { ingredient: 'a' }, { ingredient: 'b' }, { ingredient: 'c' }, { ingredient: 'd' }, { ingredient: 'e' }, { ingredient: 'f' }] },
      { id: 2, name: 'Three Ingredients', ingredients: [{ ingredient: 'egg' }, { ingredient: 'milk' }, { ingredient: 'flour' }] },
    ]);
    expect(names(await findRecipesFromPantry(repo, ['egg', 'milk']))).toEqual(['Three Ingredients', 'Seven Ingredients']);
  });

  it('breaks matching count ties alphabetically regardless of active time', async () => {
    const repo = new InMemoryRecipeRepository([
      { id: 1, name: 'Slow', activeTimeMinutes: 60, ingredients: [{ ingredient: 'egg' }] },
      { id: 2, name: 'Quick B', activeTimeMinutes: 10, ingredients: [{ ingredient: 'egg' }] },
      { id: 3, name: 'Quick A', activeTimeMinutes: 10, ingredients: [{ ingredient: 'egg' }] },
    ]);
    expect(names(await findRecipesFromPantry(repo, ['egg']))).toEqual(['Quick A', 'Quick B', 'Slow']);
  });

  it('ranks by most matching ingredients first, then alphabetically', async () => {
    const repo = new InMemoryRecipeRepository([
      { id: 1, name: 'Zebra', ingredients: [{ ingredient: 'egg' }, { ingredient: 'milk' }, { ingredient: 'x' }] },
      { id: 2, name: 'Beta', ingredients: [{ ingredient: 'egg' }, { ingredient: 'y' }] },
      { id: 3, name: 'Alpha', ingredients: [{ ingredient: 'egg' }, { ingredient: 'z' }] },
      { id: 4, name: 'Apple', activeTimeMinutes: 99, ingredients: [{ ingredient: 'egg' }, { ingredient: 'milk' }, { ingredient: 'w' }] },
    ]);
    expect(names(await findRecipesFromPantry(repo, ['egg', 'milk']))).toEqual(['Apple', 'Zebra', 'Alpha', 'Beta']);
  });

  it('returns at most 20 recipes', async () => {
    const recipes: FakeRecipe[] = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, ingredients: [{ ingredient: 'egg' }] }));
    const repo = new InMemoryRecipeRepository(recipes);
    expect(await findRecipesFromPantry(repo, ['egg'])).toHaveLength(20);
  });

  it('keeps recipes whose serving ranges overlap the selected range, including either boundary', async () => {
    const repo = new InMemoryRecipeRepository([
      { id: 1, name: 'Overlaps at lower end', servingsMin: 1, servingsMax: 3, ingredients: [{ ingredient: 'egg' }] },
      { id: 2, name: 'Overlaps at upper end', servingsMin: 4, servingsMax: 6, ingredients: [{ ingredient: 'egg' }] },
      { id: 3, name: 'Below range', servingsMin: 1, servingsMax: 2, ingredients: [{ ingredient: 'egg' }] },
      { id: 4, name: 'Above range', servingsMin: 5, servingsMax: 6, ingredients: [{ ingredient: 'egg' }] },
    ]);

    expect(names(await findRecipesFromPantry(repo, ['egg'], { servingRange: { min: 2, max: 4 } }))).toEqual([
      'Below range',
      'Overlaps at lower end',
      'Overlaps at upper end',
    ]);
  });

  it('keeps recipes at or below the maximum active cooking time', async () => {
    const repo = new InMemoryRecipeRepository([
      { id: 1, name: 'Under limit', activeTimeMinutes: 14, ingredients: [{ ingredient: 'egg' }] },
      { id: 2, name: 'At limit', activeTimeMinutes: 15, ingredients: [{ ingredient: 'egg' }] },
      { id: 3, name: 'Over limit', activeTimeMinutes: 16, ingredients: [{ ingredient: 'egg' }] },
    ]);

    expect(names(await findRecipesFromPantry(repo, ['egg'], { maxActiveMinutes: 15 }))).toEqual([
      'At limit',
      'Under limit',
    ]);
  });

  it('can require the Meal Prep tag without changing pantry match counts', async () => {
    const repo = new InMemoryRecipeRepository(
      [
        { id: 1, name: 'Regular', ingredients: [{ ingredient: 'egg' }, { ingredient: 'milk' }] },
        { id: 2, name: 'Meal Prep', ingredients: [{ ingredient: 'egg' }, { ingredient: 'milk' }, { ingredient: 'flour' }] },
      ],
      {},
      [],
      { 'meal prep': [2] },
    );

    expect(await findRecipesFromPantry(repo, ['egg', 'milk'], { mealPrepOnly: true })).toEqual([
      expect.objectContaining({
        recipe: expect.objectContaining({ name: 'Meal Prep' }),
        neededCount: 3,
        haveCount: 2,
        missingCount: 1,
      }),
    ]);
  });

  it('applies filters before the 20-recipe result limit', async () => {
    const recipes: FakeRecipe[] = Array.from({ length: 21 }, (_, index) => ({
      id: index + 1,
      name: `Recipe ${index + 1}`,
      ingredients: [{ ingredient: 'egg' }],
    }));
    const repo = new InMemoryRecipeRepository(recipes, {}, [], { 'meal prep': [21] });

    expect(names(await findRecipesFromPantry(repo, ['egg'], { mealPrepOnly: true }))).toEqual(['Recipe 21']);
  });

  it('rejects invalid serving filter ranges', async () => {
    const repo = new InMemoryRecipeRepository([{ id: 1, ingredients: [{ ingredient: 'egg' }] }]);

    await expect(
      findRecipesFromPantry(repo, ['egg'], { servingRange: { min: 4, max: 2 } }),
    ).rejects.toThrow('The serving range must be positive whole numbers with minimum at most maximum.');
  });
});
