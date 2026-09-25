// BUSINESS LAYER: domain errors.

export class RecipeNotFoundError extends Error {
  constructor(public readonly recipeId: number) {
    super(`Recipe ${recipeId} not found`);
    this.name = 'RecipeNotFoundError';
  }
}

export class InvalidServingsError extends Error {
  constructor(public readonly people: number) {
    super(`Cannot scale a recipe to ${people} people`);
    this.name = 'InvalidServingsError';
  }
}
