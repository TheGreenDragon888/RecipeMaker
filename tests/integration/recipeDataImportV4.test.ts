// Version 4's supplied import: all recipe variants are retained, as requested by the student.
import { readFileSync } from 'node:fs';
import { RECIPE_DATA_VERSION } from '../../src/data/recipeDataVersion';
import { openMemoryDatabaseForTest, openRawRecipesDb } from '../support/nodeSqliteDatabase';

const bundled = openRawRecipesDb();
const migrationPath = 'assets/data/migrations/004-college-recipes.sql';
const tables = ['recipes', 'recipe_ingredients', 'ingredients', 'ingredient_aliases', 'recipe_tags'] as const;
const rows = (table: string) => bundled.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all();
const count = (table: string, where = '1') =>
  (bundled.prepare(`SELECT count(*) AS n FROM ${table} WHERE ${where}`).get() as { n: number }).n;

afterAll(() => bundled.close());

describe('bundled version 4', () => {
  it('matches the version the app expects', () => {
    expect(RECIPE_DATA_VERSION).toBe(4);
    expect(bundled.prepare('PRAGMA user_version').get()).toEqual({ user_version: 4 });
  });

  it('retains the original 594 recipes', () => {
    expect(count('recipes', 'recipe_id <= 632')).toBe(594);
  });

  it('adds every supplied id from 633 through 2905', () => {
    const ids = bundled.prepare('SELECT recipe_id FROM recipes WHERE recipe_id >= 633 ORDER BY recipe_id').all();
    expect(ids).toEqual(Array.from({ length: 2273 }, (_, index) => ({ recipe_id: 633 + index })));
  });

  it.each([
    ['recipes', 2867],
    ['recipe_ingredients', 24477],
    ['ingredients', 593],
    ['ingredient_aliases', 1224],
    ['recipe_tags', 1618],
  ])('contains %s: %i rows', (table, expected) => {
    expect(count(table)).toBe(expected);
  });

  it('adds 1327 Meal Prep tags', () => {
    expect(count('recipe_tags', "recipe_id >= 633 AND tag = 'Meal Prep'")).toBe(1327);
  });

  it('has valid foreign keys', () => {
    expect(bundled.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
  });

  it('passes SQLite integrity checks', () => {
    expect(bundled.prepare('PRAGMA integrity_check').all()).toEqual([{ integrity_check: 'ok' }]);
  });

  it('has no repeated source URLs', () => {
    expect(bundled.prepare('SELECT source_url FROM recipes GROUP BY source_url HAVING count(*) > 1').all()).toEqual([]);
  });

  it('numbers each imported recipe ingredient consecutively from 1', () => {
    expect(bundled.prepare(`SELECT recipe_id FROM recipe_ingredients WHERE recipe_id >= 633
      GROUP BY recipe_id HAVING min(line_number) != 1 OR max(line_number) != count(*)`).all()).toEqual([]);
  });

  it('gives every imported recipe at least one ingredient', () => {
    expect(bundled.prepare(`SELECT recipe_id FROM recipes WHERE recipe_id >= 633
      AND recipe_id NOT IN (SELECT recipe_id FROM recipe_ingredients)`).all()).toEqual([]);
  });

  it('numbers the imported steps consecutively', () => {
    const recipes = bundled.prepare('SELECT recipe_id, steps FROM recipes WHERE recipe_id >= 633').all() as
      { recipe_id: number; steps: string }[];
    const invalid = recipes.filter(({ steps }) =>
      steps.split(' | ').some((step, index) => !step.startsWith(`${index + 1}. `) || step.length <= `${index + 1}. `.length),
    );
    expect(invalid).toEqual([]);
  });

  it('gives every catalog ingredient its identity alias', () => {
    expect(bundled.prepare(`SELECT i.ingredient FROM ingredients i LEFT JOIN ingredient_aliases a
      ON a.alias = i.ingredient AND a.ingredient = i.ingredient WHERE a.alias IS NULL`).all()).toEqual([]);
  });

  it('uses NULL for absent values in the imported rows', () => {
    for (const table of ['recipes', 'recipe_ingredients', 'recipe_tags']) {
      const imported = bundled.prepare(`SELECT * FROM ${table} WHERE recipe_id >= 633`).all();
      expect(imported.filter((row) => Object.values(row).includes(''))).toEqual([]);
    }
  });
});

/** Recreate the original version 3 subset in memory; never write to the bundled database. */
function version3() {
  const { raw } = openMemoryDatabaseForTest();
  const schema = bundled.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' ORDER BY rowid").all() as { sql: string }[];
  for (const { sql } of schema) raw.exec(sql);
  const originalNames = new Set((bundled.prepare('SELECT DISTINCT ingredient FROM recipe_ingredients WHERE recipe_id <= 632')
    .all() as { ingredient: string }[]).map(({ ingredient }) => ingredient.toLowerCase()));
  raw.exec('BEGIN');
  for (const table of tables) {
    for (const row of rows(table)) {
      const original = 'recipe_id' in row
        ? Number(row.recipe_id) <= 632
        : originalNames.has(String(row.ingredient).toLowerCase());
      if (!original) continue;
      const values = Object.values(row);
      raw.prepare(`INSERT INTO ${table} (${Object.keys(row).join(', ')}) VALUES (${values.map(() => '?').join(', ')})`)
        .run(...values);
    }
  }
  raw.exec('PRAGMA user_version = 3; COMMIT; PRAGMA foreign_keys = ON;');
  return raw;
}

describe('version 3 to 4 migration', () => {
  it('reproduces the bundled database without changing original records', () => {
    const raw = version3();
    try {
      const original = tables.map((table) => raw.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all());
      expect(original.map((records) => records.length)).toEqual([594, 5902, 468, 1099, 291]);
      raw.exec(readFileSync(migrationPath, 'utf8'));
      for (const [index, table] of tables.entries()) {
        const migrated = raw.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all();
        expect(migrated.slice(0, original[index].length)).toEqual(original[index]);
        expect(migrated).toEqual(rows(table));
      }
      expect(raw.prepare('PRAGMA user_version').get()).toEqual({ user_version: 4 });
      expect(raw.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
    } finally {
      raw.close();
    }
  });

  it('rejects a second apply without keeping partial changes after rollback', () => {
    const raw = version3();
    try {
      const migration = readFileSync(migrationPath, 'utf8');
      raw.exec(migration);
      const before = tables.map((table) => raw.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all());
      expect(() => raw.exec(migration)).toThrow();
      if (raw.isTransaction) raw.exec('ROLLBACK');
      expect(tables.map((table) => raw.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all())).toEqual(before);
      expect(raw.prepare('PRAGMA user_version').get()).toEqual({ user_version: 4 });
    } finally {
      raw.close();
    }
  });

  it('rolls back inserted ingredients when a later recipe insert conflicts', () => {
    const raw = version3();
    try {
      // A damaged starting copy has already used the first incoming id. The migration inserts its
      // ingredients before reaching this conflict, so rollback must undo actual partial writes.
      const recipe = { ...raw.prepare('SELECT * FROM recipes WHERE recipe_id = 1').get()!, recipe_id: 633 };
      const values = Object.values(recipe);
      raw.prepare(`INSERT INTO recipes (${Object.keys(recipe).join(', ')}) VALUES (${values.map(() => '?').join(', ')})`)
        .run(...values);
      const before = tables.map((table) => raw.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all());
      expect(() => raw.exec(readFileSync(migrationPath, 'utf8'))).toThrow();
      expect(raw.isTransaction).toBe(true);
      raw.exec('ROLLBACK');
      expect(tables.map((table) => raw.prepare(`SELECT * FROM ${table} ORDER BY rowid`).all())).toEqual(before);
      expect(raw.prepare('PRAGMA user_version').get()).toEqual({ user_version: 3 });
    } finally {
      raw.close();
    }
  });
});
