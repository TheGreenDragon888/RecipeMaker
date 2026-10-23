// The ingredients table (each ingredient's pantry unit), the recipe-line fixes that came with it, and the
// conversions that turn every counted recipe line into its ingredient's pantry unit, checked against recipes.db.
import { SqliteRecipeRepository } from '../../src/data/SqliteRecipeRepository';
import type { PantryTracking } from '../../src/domain/pantryCatalog';
import { STAPLES } from '../../src/domain/staples';
import {
  cleanAmount,
  convertAmount,
  convertPantryAmount,
  isUncountableUnit,
  pantryUnitChoices,
  unitKind,
} from '../../src/domain/unitConversions';
import { getPantryCatalog } from '../../src/services/getPantryCatalog';
import { openRawRecipesDb, openRecipesDbForTest } from '../support/nodeSqliteDatabase';

const repo = new SqliteRecipeRepository(openRecipesDbForTest());
const raw = openRawRecipesDb();

type LineRow = { recipe_id: number; line_number: number; ingredient: string; unit: string };
const line = (recipeId: number, lineNumber: number) =>
  raw
    .prepare('SELECT ingredient, unit FROM recipe_ingredients WHERE recipe_id = ? AND line_number = ?')
    .get(recipeId, lineNumber);

describe('the ingredients table', () => {
  let tracking: PantryTracking[];
  const find = (name: string) => tracking.find((row) => row.ingredient.toLowerCase() === name);

  beforeAll(async () => {
    tracking = await repo.listPantryTracking();
  });

  it('has one row for every ingredient the recipes use', () => {
    const used = raw.prepare('SELECT DISTINCT lower(ingredient) AS name FROM recipe_ingredients').all() as { name: string }[];
    expect(tracking.map((row) => row.ingredient.toLowerCase()).sort()).toEqual(used.map((row) => row.name).sort());
  });

  it('has a row for every ingredient an alias points to', () => {
    const targets = raw
      .prepare('SELECT DISTINCT lower(ingredient) AS name FROM ingredient_aliases')
      .all() as { name: string }[];
    const known = new Set(tracking.map((row) => row.ingredient.toLowerCase()));
    expect(targets.map((row) => row.name).filter((name) => !known.has(name))).toEqual([]);
  });

  it('gives a unit to exactly the counted ingredients', () => {
    expect(tracking.filter((row) => (row.tracking === 'count') !== (row.defaultUnit !== null))).toEqual([]);
  });

  it('tracks every staple as on or off', () => {
    expect(STAPLES.map((name) => find(name)?.tracking)).toEqual(STAPLES.map(() => 'presence'));
  });

  it.each([
    ['garlic', 'clove'],
    ['celery', 'stalk'],
    ['green onion', 'stalk'],
    ['ginger', 'inch'],
    ['egg', 'each'],
    ['cabbage', 'each'],
    ['spinach', 'cup'],
    ['corn', 'cup'],
    ['grape tomato', 'cup'],
    ['broccoli', 'lb'],
    ['baby bella mushroom', 'oz'],
    ['kalamata olive', 'oz'],
    ['shrimp', 'lb'],
    ['pepperoni', 'oz'],
    ['cracker', 'sleeve'],
    ['taco seasoning', 'package'],
    ['canned mixed vegetables', 'can'],
    ['mini pretzel', 'cup'],
    ['sourdough pretzel', 'each'],
  ])('counts %s in %s', (name, unit) => {
    expect(find(name)).toEqual(expect.objectContaining({ tracking: 'count', defaultUnit: unit }));
  });

  it.each(['salt', 'olive oil', 'water', 'paprika', 'basil', 'vanilla extract', 'hot sauce'])('tracks %s as on or off', (name) => {
    expect(find(name)).toEqual(expect.objectContaining({ tracking: 'presence', defaultUnit: null }));
  });

  it('puts 35 seasonings in the tray (the on/off ingredients minus the staples)', async () => {
    const catalog = await getPantryCatalog(repo);
    expect(catalog.seasoningGroups.flatMap((group) => group.seasonings)).toHaveLength(35);
  });
});

describe('recipe-line fixes', () => {
  it.each([
    [4, 3, 'garlic', 'clove'],
    [89, 3, 'garlic', 'clove'],
    [21, 2, 'celery', 'stalk'],
    [120, 11, 'French bread', 'slice'],
    [72, 1, 'Italian sausage', 'link'],
    [127, 2, 'canned mixed vegetables', 'can'],
    [116, 3, 'canned diced tomatoes', 'can'],
    [20, 4, 'canned mushrooms', 'can'],
    [16, 2, 'mini pretzel', 'each'],
    [46, 6, 'mini pretzel', 'each'],
    [52, 4, 'sourdough pretzel', 'cup'],
    [95, 8, 'sourdough pretzel', 'each'],
  ])('recipe %i line %i is %s in %s', (recipeId, lineNumber, ingredient, unit) => {
    expect(line(recipeId, lineNumber)).toEqual({ ingredient, unit });
  });

  it.each([
    ['canned mixed vegetables', 'canned mixed vegetables'],
    ['diced tomatoes', 'canned diced tomatoes'],
    ['canned mushrooms', 'canned mushrooms'],
    ['pretzel', 'mini pretzel'],
    ['pretzels', 'mini pretzel'],
    ['mini pretzels', 'mini pretzel'],
    ['sourdough pretzels', 'sourdough pretzel'],
  ])('the name "%s" finds %s', async (typed, ingredient) => {
    expect(await repo.findIngredient(typed)).toBe(ingredient);
  });
});

describe('conversions', () => {
  it("can turn every counted recipe line into its ingredient's pantry unit", async () => {
    const units = new Map(
      (await repo.listPantryTracking()).map((row) => [row.ingredient.toLowerCase(), row.defaultUnit]),
    );
    const lines = raw
      .prepare('SELECT recipe_id, line_number, ingredient, unit FROM recipe_ingredients')
      .all() as LineRow[];
    const unconvertible = lines
      .filter((row) => {
        const pantryUnit = units.get(row.ingredient.toLowerCase());
        if (!pantryUnit || isUncountableUnit(row.unit)) return false; // on/off, or no amount to convert
        return convertAmount(row.ingredient, 1, row.unit, pantryUnit) === null;
      })
      .map((row) => `${row.ingredient}: ${row.unit} -> ${units.get(row.ingredient.toLowerCase())}`);
    expect([...new Set(unconvertible)]).toEqual([]);
  });
});

describe('unit chips (pantryUnitChoices)', () => {
  let counted: { ingredient: string; unit: string }[];

  beforeAll(async () => {
    counted = (await repo.listPantryTracking())
      .filter((row) => row.defaultUnit !== null)
      .map((row) => ({ ingredient: row.ingredient, unit: row.defaultUnit as string }));
  });

  it('turns 7 of every chip back into exactly 7 of the pantry unit', () => {
    const drifting = counted.flatMap(({ ingredient, unit }) =>
      pantryUnitChoices(ingredient, unit)
        .filter((choice) => {
          const out = convertPantryAmount(ingredient, 7, unit, choice.unit);
          const back = out && convertPantryAmount(ingredient, out.amount, choice.unit, unit);
          return !back || cleanAmount(back.amount) !== 7;
        })
        .map((choice) => `${ingredient}: ${unit} -> ${choice.unit}`),
    );
    expect(drifting).toEqual([]);
  });

  it('offers other units for every ingredient counted by volume or weight', () => {
    const alone = counted
      .filter(({ unit }) => unitKind(unit) !== 'count')
      .filter(({ ingredient, unit }) => pantryUnitChoices(ingredient, unit).length === 1)
      .map(({ ingredient }) => ingredient);
    expect(alone).toEqual([]);
  });

  it('offers only its own unit for 84 of the 229 counted ingredients (cans, packages, most produce)', () => {
    const alone = counted.filter(({ ingredient, unit }) => pantryUnitChoices(ingredient, unit).length === 1);
    expect([alone.length, counted.length]).toEqual([84, 229]);
  });
});
