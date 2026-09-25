import { SqliteRecipeRepository } from '../../src/data/SqliteRecipeRepository';
import { openRecipesDbForTest } from '../support/nodeSqliteDatabase';

const repo = new SqliteRecipeRepository(openRecipesDbForTest());
const names = (rs: { name: string }[]) => rs.map((r) => r.name);

describe('SqliteRecipeRepository', () => {
  describe('getRecipe', () => {
    it('maps a recipe row to a Recipe', async () => {
      const recipe = await repo.getRecipe(1);
      expect(recipe).toEqual(
        expect.objectContaining({
          id: 1,
          name: 'Spicy Sriracha Noodles',
          sourceSite: 'Budget Bytes',
          sourceUrl: 'https://www.budgetbytes.com/spicy-noodles/',
          totalTimeMinutes: 15,
          activeTimeMinutes: 15,
          totalTimeIsEstimated: false,
          servingsMin: 2,
          servingsMax: 2,
          servingsIsEstimated: false,
          yieldQuantity: 2,
          yieldUnit: 'serving',
          duplicateGroup: null,
        }),
      );
    });

    it('splits steps into a list without the leading numbers', async () => {
      const recipe = await repo.getRecipe(1);
      expect(recipe?.steps).toHaveLength(6);
      expect(recipe?.steps[0]).toBe(
        'Prepare the sauce for the noodles. In a small bowl, stir together the brown sugar, soy sauce, and sriracha. Set the sauce aside.',
      );
    });

    it('maps estimated flags to true and a missing yield to null', async () => {
      const recipe = await repo.getRecipe(49); // Asian Chicken Wings
      expect(recipe).toEqual(
        expect.objectContaining({ totalTimeIsEstimated: true, servingsIsEstimated: true, yieldQuantity: null, yieldUnit: null }),
      );
    });

    it('returns null for an id that does not exist', async () => {
      expect(await repo.getRecipe(87)).toBeNull();
    });

    it('parses every recipe into non-empty steps with no leading numbers', async () => {
      for (const { id } of await repo.listRecipeSummaries()) {
        const recipe = await repo.getRecipe(id);
        for (const step of recipe!.steps) {
          expect(step.length).toBeGreaterThan(0);
          expect(step).not.toMatch(/^\d+\./);
        }
      }
    });
  });

  describe('getIngredients', () => {
    it('returns ingredient lines in line order, mapped to RecipeIngredient', async () => {
      const ingredients = await repo.getIngredients(1);
      expect(ingredients).toHaveLength(9);
      expect(ingredients[0]).toEqual({
        lineNumber: 1,
        component: null,
        ingredient: 'lo mein noodle',
        quantityMin: 4,
        quantityMax: 4,
        unit: 'oz',
        preparation: null,
        substitute: null,
        isOptional: false,
      });
      expect(ingredients[7]).toEqual(expect.objectContaining({ ingredient: 'cilantro', isOptional: true }));
    });

    it('keeps sub-recipe component labels', async () => {
      const ingredients = await repo.getIngredients(11);
      expect(ingredients[0].component).toBe('dragon sauce');
    });
  });

  describe('findByIngredient', () => {
    it('finds recipes by exact canonical name, ordered by total time', async () => {
      expect(names(await repo.findByIngredient('chickpea'))).toEqual([
        'Scallion Herb Chickpea Salad',
        'Greek Style Sausage & Chick Peas',
        'Curried Chickpeas with Spinach',
        'Pasta e Ceci',
      ]);
    });

    it('resolves an alias to its canonical name', async () => {
      expect(await repo.findByIngredient('scallions')).toHaveLength(23);
    });

    it('returns nothing when there is no exact match', async () => {
      expect(await repo.findByIngredient('noodle')).toEqual([]);
    });
  });

  describe('findByIngredientContaining', () => {
    it('matches part of an ingredient name, ordered by recipe name', async () => {
      expect(names(await repo.findByIngredientContaining('noodle'))).toEqual([
        'Hearty Beef Noodle Soup',
        'Quick and Easy Goulash',
        'Spicy Sriracha Noodles',
      ]);
    });

    it('treats % and _ as literal characters, not wildcards', async () => {
      expect(await repo.findByIngredientContaining('%')).toEqual([]);
      expect(await repo.findByIngredientContaining('_')).toEqual([]);
    });
  });

  describe('resolveIngredientNames', () => {
    it('maps aliases to canonical names and keeps unknown names unchanged', async () => {
      expect(await repo.resolveIngredientNames(['eggs', 'parmesan', 'dragonfruit'])).toEqual([
        'egg',
        'Parmesan cheese',
        'dragonfruit',
      ]);
    });
  });

  describe('suggestIngredients', () => {
    it('returns canonical names matching by name or alias prefix', async () => {
      expect(await repo.suggestIngredients('par', 10)).toEqual(['Parmesan cheese', 'parsley']);
    });

    it('respects the limit', async () => {
      expect(await repo.suggestIngredients('c', 3)).toHaveLength(3);
    });

    it('treats % as a literal character', async () => {
      expect(await repo.suggestIngredients('%', 10)).toEqual([]);
    });
  });

  describe('listRecipeSummaries and listIngredientUsage', () => {
    it('lists every recipe', async () => {
      expect(await repo.listRecipeSummaries()).toHaveLength(130);
    });

    it('lists every ingredient line with its optional flag as a boolean', async () => {
      const usage = await repo.listIngredientUsage();
      expect(usage).toHaveLength(1017);
      expect(usage).toContainEqual({ recipeId: 1, ingredient: 'cilantro', isOptional: true });
    });
  });

  describe('findByDuplicateGroup', () => {
    it('returns every recipe in the group', async () => {
      expect(names(await repo.findByDuplicateGroup('DUP-4 Chicken Nuggets'))).toEqual([
        'Pretzel Coated Chicken Nuggets',
        'Homemade Chicken Nuggets',
      ]);
    });
  });
});
