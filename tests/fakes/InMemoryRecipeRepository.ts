import type { RecipeRepository } from '../../src/domain/RecipeRepository';
import type { IngredientUsage, Recipe, RecipeIngredient, RecipeSummary } from '../../src/domain/recipe';
import type { IngredientSuggestion } from '../../src/domain/ingredientSuggestion';

export type FakeRecipe = Partial<Recipe> & { id: number; ingredients?: Partial<RecipeIngredient>[] };

export function makeRecipe(overrides: Partial<Recipe> & { id: number }): Recipe {
  return {
    name: `Recipe ${overrides.id}`,
    totalTimeMinutes: 30,
    activeTimeMinutes: 30,
    servingsMin: 4,
    servingsMax: 4,
    sourceSite: 'Test Kitchen',
    sourceUrl: `https://example.com/${overrides.id}`,
    totalTimeIsEstimated: false,
    servingsIsEstimated: false,
    yieldQuantity: null,
    yieldUnit: null,
    steps: ['Cook it.'],
    duplicateGroup: null,
    ...overrides,
  };
}

export function makeIngredient(overrides: Partial<RecipeIngredient>): RecipeIngredient {
  return {
    lineNumber: 1,
    component: null,
    ingredient: 'salt',
    quantityMin: 1,
    quantityMax: 1,
    unit: 'tsp',
    preparation: null,
    substitute: null,
    isOptional: false,
    ...overrides,
  };
}

const toSummary = (r: Recipe): RecipeSummary => ({
  id: r.id,
  name: r.name,
  totalTimeMinutes: r.totalTimeMinutes,
  activeTimeMinutes: r.activeTimeMinutes,
  servingsMin: r.servingsMin,
  servingsMax: r.servingsMax,
});

/** Test double for RecipeRepository. Aliases map lowercase alias -> canonical name. */
export class InMemoryRecipeRepository implements RecipeRepository {
  private readonly recipes: Recipe[];
  private readonly ingredients = new Map<number, RecipeIngredient[]>();
  private readonly aliases: Map<string, string>;

  constructor(recipes: FakeRecipe[] = [], aliases: Record<string, string> = {}) {
    this.recipes = recipes.map(({ ingredients, ...r }) => makeRecipe(r));
    for (const { id, ingredients = [] } of recipes) {
      this.ingredients.set(
        id,
        ingredients.map((ing, i) => makeIngredient({ lineNumber: i + 1, ...ing })),
      );
    }
    this.aliases = new Map(Object.entries(aliases).map(([k, v]) => [k.toLowerCase(), v]));
  }

  private resolve(name: string): string {
    return this.aliases.get(name.toLowerCase()) ?? name;
  }

  private usesIngredient(id: number, match: (ingredient: string) => boolean): boolean {
    return (this.ingredients.get(id) ?? []).some((ing) => match(ing.ingredient.toLowerCase()));
  }

  async findByIngredient(name: string) {
    const canonical = this.resolve(name).toLowerCase();
    return this.recipes.filter((r) => this.usesIngredient(r.id, (i) => i === canonical)).map(toSummary);
  }

  async findByIngredientContaining(text: string) {
    const needle = text.toLowerCase();
    return this.recipes.filter((r) => this.usesIngredient(r.id, (i) => i.includes(needle))).map(toSummary);
  }

  async getRecipe(id: number) {
    return this.recipes.find((r) => r.id === id) ?? null;
  }

  async getIngredients(recipeId: number) {
    return this.ingredients.get(recipeId) ?? [];
  }

  async listRecipeSummaries() {
    return this.recipes.map(toSummary);
  }

  async listIngredientUsage(): Promise<IngredientUsage[]> {
    return [...this.ingredients].flatMap(([recipeId, ings]) =>
      ings.map((ing) => ({ recipeId, ingredient: ing.ingredient, isOptional: ing.isOptional })),
    );
  }

  async resolveIngredientNames(names: string[]) {
    return names.map((n) => this.resolve(n));
  }

  async suggestIngredients(prefix: string, limit: number) {
    const p = prefix.toLowerCase();
    const suggestions = new Map<string, IngredientSuggestion>();
    for (const ings of this.ingredients.values()) {
      for (const ing of ings) {
        if (ing.ingredient.toLowerCase().startsWith(p)) {
          suggestions.set(ing.ingredient, { ingredient: ing.ingredient, matchedAlias: null });
        }
      }
    }
    for (const [alias, canonical] of this.aliases) {
      if (alias.startsWith(p) && !suggestions.has(canonical)) {
        suggestions.set(canonical, { ingredient: canonical, matchedAlias: alias });
      }
    }
    return [...suggestions.values()].sort((a, b) =>
      Number(a.matchedAlias !== null) - Number(b.matchedAlias !== null) ||
      a.ingredient.localeCompare(b.ingredient),
    ).slice(0, limit);
  }

  async findIngredient(name: string) {
    const alias = this.aliases.get(name.toLowerCase());
    if (alias) return alias;
    for (const ings of this.ingredients.values()) {
      const match = ings.find((ing) => ing.ingredient.toLowerCase() === name.toLowerCase());
      if (match) return match.ingredient;
    }
    return null;
  }

  async findByDuplicateGroup(group: string) {
    return this.recipes.filter((r) => r.duplicateGroup === group).map(toSummary);
  }
}
