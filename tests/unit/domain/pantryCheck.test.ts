import { checkRecipeLines, type OnHand } from '../../../src/domain/pantryCheck';
import type { PantryItem } from '../../../src/domain/pantry';
import type { RecipeIngredient } from '../../../src/domain/recipe';
import { makeIngredient } from '../../fakes/InMemoryRecipeRepository';

const garlicLine = makeIngredient({ lineNumber: 1, ingredient: 'garlic', quantityMin: 3, quantityMax: 3, unit: 'clove' });
const garlic = (quantity: number): PantryItem => ({ name: 'garlic', quantity, unit: 'clove' });

const pantryOf = (items: PantryItem[], seasoningsOn: string[] = []): OnHand => ({ items, seasoningsOn });
const NOTHING = pantryOf([]);

/** The check for one line, checked on its own against the pantry. */
function checkOf(line: RecipeIngredient, onHand: OnHand) {
  return checkRecipeLines([line], onHand).get(line.lineNumber);
}

describe('checkRecipeLines', () => {
  describe('in the pantry or not', () => {
    it('marks a required ingredient that is not in the pantry as missing', () => {
      expect(checkOf(garlicLine, NOTHING)).toEqual({ status: 'missing' });
    });

    it('marks an ingredient on the pantry list as have', () => {
      expect(checkOf(garlicLine, pantryOf([garlic(6)]))?.status).toBe('have');
    });

    it('matches pantry names whatever their case and spacing', () => {
      const typed: PantryItem = { name: ' Garlic ', quantity: 6, unit: 'clove' };
      expect(checkOf(garlicLine, pantryOf([typed]))?.status).toBe('have');
    });

    it('marks a seasoning that is switched on as have', () => {
      const paprika = makeIngredient({ ingredient: 'paprika', quantityMin: 1, quantityMax: 1, unit: 'tsp' });
      expect(checkOf(paprika, pantryOf([], ['paprika']))?.status).toBe('have');
    });

    it('gives every line of the recipe a check, keyed by its line number', () => {
      const onion = makeIngredient({ lineNumber: 2, ingredient: 'onion', quantityMin: 1, quantityMax: 1, unit: 'each' });
      const checks = checkRecipeLines([garlicLine, onion], pantryOf([garlic(6)]));
      expect([...checks.keys()]).toEqual([1, 2]);
    });
  });

  describe('staples and optional lines', () => {
    it('marks a staple as a staple, since matching assumes every kitchen has it', () => {
      const oil = makeIngredient({ ingredient: 'olive oil', quantityMin: 2, quantityMax: 2, unit: 'tbsp' });
      expect(checkOf(oil, NOTHING)).toEqual({ status: 'staple' });
    });

    it('marks an optional ingredient the pantry lacks as optional, not missing', () => {
      const cilantro = makeIngredient({ ingredient: 'cilantro', unit: 'handful', isOptional: true });
      expect(checkOf(cilantro, NOTHING)).toEqual({ status: 'optional' });
    });

    it('marks an optional ingredient the pantry has as have', () => {
      const optionalGarlic = { ...garlicLine, isOptional: true };
      expect(checkOf(optionalGarlic, pantryOf([garlic(6)]))?.status).toBe('have');
    });
  });

  describe('swaps', () => {
    const chiliSauceLine = makeIngredient({
      ingredient: 'chili garlic sauce',
      quantityMin: 1,
      quantityMax: 1,
      unit: 'tbsp',
      substitute: 'sriracha',
    });
    const sriracha: PantryItem = { name: 'sriracha', quantity: 1, unit: 'bottle' };

    it('marks a line as a swap when the pantry has its substitute', () => {
      expect(checkOf(chiliSauceLine, pantryOf([sriracha]))).toMatchObject({ status: 'swap', substitute: 'sriracha' });
    });

    it("finds the substitute in the pantry by its resolved name, and keeps the recipe's wording", () => {
      const rollsLine = makeIngredient({ lineNumber: 4, ingredient: 'potato roll', unit: 'each', substitute: 'hamburger buns' });
      const buns: PantryItem = { name: 'hamburger bun', quantity: 12, unit: 'each' };
      const checks = checkRecipeLines([rollsLine], pantryOf([buns]), new Map([[4, 'hamburger bun']]));
      expect(checks.get(4)).toMatchObject({ status: 'swap', substitute: 'hamburger buns' });
    });

    it('offers a staple substitute as a swap, since every kitchen is assumed to have it', () => {
      const butter = makeIngredient({ ingredient: 'butter', quantityMin: 1, quantityMax: 1, unit: 'tbsp', substitute: 'cooking spray' });
      expect(checkOf(butter, NOTHING)).toMatchObject({ status: 'swap', substitute: 'cooking spray' });
    });

    it('keeps a line missing when the pantry lacks its substitute too', () => {
      expect(checkOf(chiliSauceLine, NOTHING)).toEqual({ status: 'missing' });
    });

    it('marks a line as have, not a swap, when the pantry has the ingredient itself', () => {
      const chiliSauce: PantryItem = { name: 'chili garlic sauce', quantity: 1, unit: 'jar' };
      expect(checkOf(chiliSauceLine, pantryOf([chiliSauce, sriracha]))?.status).toBe('have');
    });

    it('offers a swap for an optional line the pantry lacks', () => {
      const pecans = makeIngredient({ ingredient: 'pecan', unit: 'tbsp', substitute: 'walnut', isOptional: true });
      const walnuts: PantryItem = { name: 'walnut', quantity: 1, unit: 'cup' };
      expect(checkOf(pecans, pantryOf([walnuts]))?.status).toBe('swap');
    });

    it("gives the substitute's amount on hand in the line's unit", () => {
      const srirachaInTbsp: PantryItem = { name: 'sriracha', quantity: 4, unit: 'tbsp' };
      expect(checkOf(chiliSauceLine, pantryOf([srirachaInTbsp]))).toEqual({
        status: 'swap',
        substitute: 'sriracha',
        have: { amount: 4, unit: 'tbsp', approximate: false },
      });
    });

    it("gives the substitute's amount in its pantry unit when the line's unit doesn't convert to it", () => {
      expect(checkOf(chiliSauceLine, pantryOf([sriracha]))).toMatchObject({
        have: { amount: 1, unit: 'bottle', approximate: false },
      });
    });

    it('gives no amount for a staple substitute', () => {
      const butter = makeIngredient({ ingredient: 'butter', quantityMin: 1, quantityMax: 1, unit: 'tbsp', substitute: 'cooking spray' });
      expect(checkOf(butter, NOTHING)).toMatchObject({ have: null });
    });
  });

  describe('amounts', () => {
    const butterLine = (lineNumber: number, quantity: number, unit: string, isOptional = false) =>
      makeIngredient({ lineNumber, ingredient: 'butter', quantityMin: quantity, quantityMax: quantity, unit, isOptional });
    const butter = (tbsp: number): PantryItem => ({ name: 'butter', quantity: tbsp, unit: 'tbsp' });

    it("gives the amount on hand in the line's unit", () => {
      expect(checkOf(garlicLine, pantryOf([garlic(6)]))).toEqual({
        status: 'have',
        have: { amount: 6, unit: 'clove', approximate: false },
      });
    });

    it("converts the amount on hand into the line's unit", () => {
      expect(checkOf(butterLine(1, 0.25, 'cup'), pantryOf([butter(8)]))).toMatchObject({
        have: { amount: 0.5, unit: 'cup', approximate: false },
      });
    });

    it('marks the amount approximate when the conversion rests on a typical size', () => {
      const mincedGarlic = makeIngredient({ ingredient: 'garlic', quantityMin: 1, quantityMax: 1, unit: 'tbsp' });
      expect(checkOf(mincedGarlic, pantryOf([garlic(6)]))).toMatchObject({
        have: { amount: 2, unit: 'tbsp', approximate: true },
      });
    });

    it('marks a line as not enough when the pantry has less than it needs', () => {
      expect(checkOf(garlicLine, pantryOf([garlic(2)]))).toEqual({
        status: 'notEnough',
        have: { amount: 2, unit: 'clove', approximate: false },
        short: { amount: 1, unit: 'clove', approximate: false },
      });
    });

    it('counts exactly what the line needs as enough', () => {
      expect(checkOf(garlicLine, pantryOf([garlic(3)]))?.status).toBe('have');
    });

    it("adds up an ingredient's lines before comparing with the pantry", () => {
      // 2 tbsp + 1/4 cup = 6 tbsp needed, with 5 on hand: both lines are 1 tbsp short.
      const checks = checkRecipeLines([butterLine(1, 2, 'tbsp'), butterLine(2, 0.25, 'cup')], pantryOf([butter(5)]));
      expect(checks.get(1)).toEqual({
        status: 'notEnough',
        have: { amount: 5, unit: 'tbsp', approximate: false },
        short: { amount: 1, unit: 'tbsp', approximate: false },
      });
      expect(checks.get(2)).toMatchObject({
        status: 'notEnough',
        have: { amount: 0.3125, unit: 'cup' },
        short: { amount: 0.0625, unit: 'cup' },
      });
    });

    it('needs only the smaller amount of a range', () => {
      const twoToThree = { ...garlicLine, quantityMin: 2, quantityMax: 3 };
      expect(checkOf(twoToThree, pantryOf([garlic(2)]))?.status).toBe('have');
    });

    it('leaves optional lines out of the total and never marks them as not enough', () => {
      const checks = checkRecipeLines([butterLine(1, 2, 'tbsp'), butterLine(2, 4, 'tbsp', true)], pantryOf([butter(2)]));
      expect([checks.get(1)?.status, checks.get(2)?.status]).toEqual(['have', 'have']);
    });

    it('marks a line without an amount as have', () => {
      const garlicToTaste = { ...garlicLine, quantityMin: null, quantityMax: null, unit: 'to taste' };
      expect(checkOf(garlicToTaste, pantryOf([garlic(1)]))?.status).toBe('have');
    });

    it('gives no amount for a seasoning that is switched on', () => {
      const paprika = makeIngredient({ ingredient: 'paprika', quantityMin: 1, quantityMax: 1, unit: 'tsp' });
      expect(checkOf(paprika, pantryOf([], ['paprika']))).toEqual({ status: 'have', have: null });
    });

    it("compares nothing when the pantry item's unit isn't known", () => {
      const garlicNoUnit: PantryItem = { name: 'garlic', quantity: 1, unit: null };
      expect(checkOf(garlicLine, pantryOf([garlicNoUnit]))).toEqual({
        status: 'have',
        have: { amount: 1, unit: null, approximate: false },
      });
    });
  });
});
