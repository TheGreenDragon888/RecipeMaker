// BUSINESS LAYER: convert an ingredient amount from a recipe's unit to the ingredient's pantry unit, and between
// the units the pantry can show it in (its unit chips).
import { normalizeSearchTerm } from './searchTerm';

/** A converted amount. Approximate when it rests on a typical size or density rather than a fixed definition. */
export type Conversion = { amount: number; approximate: boolean };

/** Amounts a recipe gives without a countable quantity; they never convert to a pantry count. */
const UNCOUNTABLE_UNITS = new Set(['to taste', 'as needed', 'pinch', 'dash', 'handful', 'batch']);

export function isUncountableUnit(unit: string): boolean {
  return UNCOUNTABLE_UNITS.has(unit);
}

/** Millilitres in a US teaspoon, and grams in an ounce: both exact by definition. */
const ML_PER_TSP = 4.92892159375;
const G_PER_OZ = 28.349523125;

/**
 * Each unit's size in the base unit of its kind: teaspoons for volume, ounces for weight. Unit names are
 * lower case ("ml", "l"); the screen shows them as "mL" and "L".
 */
const VOLUME_IN_TSP: Record<string, number> = { tsp: 1, tbsp: 3, cup: 48, pint: 96, ml: 1 / ML_PER_TSP, l: 1000 / ML_PER_TSP };
const WEIGHT_IN_OZ: Record<string, number> = { oz: 1, lb: 16, g: 1 / G_PER_OZ, kg: 1000 / G_PER_OZ };

const has = (sizes: Record<string, number>, unit: string) => Object.prototype.hasOwnProperty.call(sizes, unit);

export type UnitKind = 'volume' | 'weight' | 'count';

/** Whether a unit measures volume, weight, or counts pieces and packages ("each", "can", "dozen"). */
export function unitKind(unit: string): UnitKind {
  if (has(VOLUME_IN_TSP, unit)) return 'volume';
  if (has(WEIGHT_IN_OZ, unit)) return 'weight';
  return 'count';
}

/** One ingredient's factor: 1 of the recipe unit = `factor` of the pantry unit `to`. */
type IngredientFactor = { to: string; factor: number; exact?: true };

/**
 * Factors that depend on the ingredient (pieces, densities, package sizes), keyed by canonical name in lower case,
 * then by the recipe's unit. Approximate unless marked exact. Values and sources were reviewed by the student.
 */
// Sources: "recipe" = an equivalence stated in a recipes.db line; FDC = USDA FoodData Central household
// measures; BC = Betty Crocker's yields chart; AFME = Amazing Food Made Easy produce converters.
// Full citations and reviewer notes: the conversion review table from 2026-10-22/23.
const INGREDIENT_FACTORS: Record<string, Record<string, IngredientFactor>> = {
  // Counted by the dozen
  egg: { dozen: { to: 'each', factor: 12, exact: true } }, // a dozen is 12

  // Produce counted by the piece
  cabbage: {
    cup: { to: 'each', factor: 0.125 }, // shredded; a medium head gives about 8 cups (AFME)
    head: { to: 'each', factor: 1, exact: true }, // "each" is one head
  },
  carrot: { cup: { to: 'each', factor: 2 } }, // recipe: "2 medium carrots ... (about 1 cup)"; BC
  celery: {
    cup: { to: 'stalk', factor: 2 }, // recipe: "2 celery ribs (finely diced, 1 cup, 105g)"
    tbsp: { to: 'stalk', factor: 0.125 }, // the cup factor / 16
  },
  cucumber: { cup: { to: 'each', factor: 0.667 } }, // diced; a medium cucumber gives about 1.5 cups (AFME)
  eggplant: { cup: { to: 'each', factor: 0.25 } }, // diced; a 1 lb eggplant gives about 4 cups (MSU Extension)
  escarole: { head: { to: 'each', factor: 1, exact: true } }, // "each" is one head
  garlic: { tbsp: { to: 'clove', factor: 3 } }, // minced; a medium clove gives about 1 tsp (AFME)
  ginger: {
    tbsp: { to: 'inch', factor: 1 }, // grated; common rule "1 inch ≈ 1 tbsp" (no authoritative source)
    tsp: { to: 'inch', factor: 1 / 3 }, // the tbsp factor / 3
  },
  'green bell pepper': { cup: { to: 'each', factor: 1 } }, // chopped; "1 cup chopped = 1 medium" (BC)
  'green onion': {
    each: { to: 'stalk', factor: 1, exact: true }, // the recipe data's "each" is one whole green onion
    cup: { to: 'stalk', factor: 8 }, // recipe: "1/4 cup sliced scallions (about two)"
    tbsp: { to: 'stalk', factor: 0.5 }, // the cup factor / 16
    bunch: { to: 'stalk', factor: 7 }, // a bunch holds about 6-8 (AFME)
  },
  onion: { cup: { to: 'each', factor: 1 } }, // chopped medium onion
  'red onion': {
    cup: { to: 'each', factor: 1 }, // recipe: "½ small red onion (finely diced, 80g, ½ cup)"
    tbsp: { to: 'each', factor: 1 / 16 }, // the cup factor / 16
  },
  tomato: { cup: { to: 'each', factor: 4 / 3 } }, // chopped; a medium tomato gives about 3/4 cup
  'yellow squash': { cup: { to: 'each', factor: 0.575 } }, // FDC 2709807: 1 cup = 115 g, 1 squash = 200 g
  zucchini: { cup: { to: 'each', factor: 0.63 } }, // cubed; a medium zucchini of 196 g gives about 1.6 cups (FDC)
  'baby potato': { lb: { to: 'each', factor: 14 } }, // baby potatoes of about 1-1.3 oz

  // Produce counted by weight (sold in labelled packages)
  mushroom: {
    cup: { to: 'oz', factor: 2.47 }, // FDC 169251: 1 cup pieces = 70 g
    each: { to: 'oz', factor: 0.635 }, // FDC 169251: 1 medium = 18 g
  },
  'white mushroom': { each: { to: 'oz', factor: 0.635 } }, // FDC 169251: 1 medium = 18 g
  'portobello mushroom': { cup: { to: 'oz', factor: 3.03 } }, // FDC 169255: 1 cup diced = 86 g
  'kalamata olive': {
    cup: { to: 'oz', factor: 4.76 }, // FDC 2710090 (olives): 1 cup = 135 g
    each: { to: 'oz', factor: 0.176 }, // FDC 2710090: 1 olive = 5 g
    jar: { to: 'oz', factor: 6, exact: true }, // recipe: "1 6oz. jar" (drained weight on the label)
  },
  arugula: { oz: { to: 'cup', factor: 1.4 } }, // loose leaves; FDC: 1/2 cup = 10 g
  spinach: { oz: { to: 'cup', factor: 0.95 } }, // loose raw leaves; 1 cup = 30 g (FDC)

  // Meat and fish
  bacon: { oz: { to: 'slice', factor: 1.125 } }, // regular cut, about 18 slices per lb
  'chicken breast': {
    lb: { to: 'each', factor: 16 / 6 }, // recipe: "4- (6-ounce) boneless chicken breasts"
    oz: { to: 'each', factor: 1 / 6 }, // a 6 oz breast
    cup: { to: 'each', factor: 1.1 }, // cooked, diced: 140 g per cup; a 6 oz raw breast cooks to about 125-130 g
  },
  'italian sausage': { lb: { to: 'link', factor: 4.25 } }, // recipe: "14 links ... approx. 3-3 ½ lbs"
  pepperoni: { slice: { to: 'oz', factor: 0.067 } }, // standard pizza pepperoni, about 2 g a slice
  shrimp: { each: { to: 'lb', factor: 0.04 } }, // jumbo, about 25 per lb (recipe: "Jumbo 21/25")

  // Cheese
  'american cheese': { oz: { to: 'slice', factor: 1.5 } }, // wrapped singles of about 19 g
  cheese: { slice: { to: 'oz', factor: 0.67 } }, // a deli slice of about 19 g
  'cheddar cheese': {
    oz: { to: 'cup', factor: 0.25 }, // recipe: "2 oz. cheddar, shredded (about ½ cup)"
    slice: { to: 'cup', factor: 0.19 }, // a 3/4 oz slice, at the oz factor
  },
  'feta cheese': { cup: { to: 'oz', factor: 5.3 } }, // crumbled: 1 cup = 150 g
  'fresh mozzarella cheese': { cup: { to: 'oz', factor: 4.66 } }, // FDC 2705722: 1 cup diced = 132 g

  // Pasta, bread and snacks
  'egg noodle': {
    package: { to: 'oz', factor: 12, exact: true }, // recipe: "1 (12 ounce) package"
    cup: { to: 'oz', factor: 1.34 }, // dry: 1 cup = 38 g
  },
  'elbow macaroni': {
    lb: { to: 'cup', factor: 3.72 }, // dry: 1 cup = 122 g (USDA)
    box: { to: 'cup', factor: 1.86 }, // recipe: "1 (8 ounce) box", at the lb factor
  },
  fettuccine: { package: { to: 'lb', factor: 1, exact: true } }, // recipe: "1 (16 ounce) package"
  'french bread': { slice: { to: 'loaf', factor: 0.05 } }, // thick slices from a 24-inch loaf, about 20 a loaf
  'pizza dough': {
    container: { to: 'each', factor: 1, exact: true }, // "each" is one ball or tube
    lb: { to: 'each', factor: 1 }, // store dough balls are usually 1 lb
  },
  cracker: { each: { to: 'sleeve', factor: 1 / 32 } }, // Ritz-style, 32 a sleeve
  'mini pretzel': { each: { to: 'cup', factor: 0.0375 } }, // FDC 2708248: 1 mini = 1.5 g, 1 cup = 40 g
  'sourdough pretzel': { cup: { to: 'each', factor: 3 } }, // chopped pieces: 1 oz = 1 pretzel, about 1/3 cup
  'tortilla chip': { package: { to: 'bag', factor: 1, exact: true } }, // a package of chips is one bag

  // Frozen vegetables
  'frozen broccoli': {
    lb: { to: 'cup', factor: 5.3 }, // florets: 1 cup = 85 g (label)
    package: { to: 'cup', factor: 2.9 }, // a 16 oz package, chopped: 1 cup = 156 g (FDC 169968)
  },
  'frozen mixed vegetables': { oz: { to: 'cup', factor: 0.215 } }, // label: 2/3 cup = 88 g
  'frozen spinach': { lb: { to: 'cup', factor: 1.8 } }, // chopped, packed: label 1/3 cup = 83 g

  // Cans, jars and cubes
  'canned tuna': {
    oz: { to: 'can', factor: 0.2 }, // recipe: "five 5-ounce cans"
    jar: { to: 'can', factor: 1.3 }, // recipe: "1 (6.5 ounce) jar", in 5 oz cans
  },
  'chicken bouillon cube': { cube: { to: 'each', factor: 1, exact: true } }, // one cube is one
  'coconut milk': { can: { to: 'cup', factor: 1.69 } }, // recipe: "1 13.5oz. can"
  corn: { can: { to: 'cup', factor: 1.5 } }, // a 15.25 oz can, drained
  'marinara sauce': { jar: { to: 'cup', factor: 3 } }, // recipe: "1 (26 ounce) jar"
  salsa: { jar: { to: 'cup', factor: 2 } }, // recipe: "1 16oz. jar"
  'cherry tomato': { each: { to: 'cup', factor: 0.1 } }, // halved; about 17 g each
};

/** The factor from one unit to another of the same kind (volume or weight), or null when they differ in kind. */
function generalFactor(from: string, to: string): number | null {
  for (const sizes of [VOLUME_IN_TSP, WEIGHT_IN_OZ]) {
    if (has(sizes, from) && has(sizes, to)) return sizes[from] / sizes[to];
  }
  return null;
}

/** generalFactor, plus 1 between a unit and itself (so count units like "each" link to themselves). */
function sameUnitOrGeneral(from: string, to: string): number | null {
  return from === to ? 1 : generalFactor(from, to);
}

/**
 * Drops floating-point noise, so 4 oz converted out and back is 4, not 3.9999999999999996. Use it once, on an
 * amount about to be stored: rounding each step of a chain of conversions would lose precision instead.
 */
export function cleanAmount(amount: number): number {
  return Number(amount.toPrecision(12));
}

/**
 * Converts an amount of an ingredient between any two units, in either direction: the same kind directly, or
 * through at most one of the ingredient's factors, with a same-kind step on either side of it (1 chicken
 * breast → 6 oz → 170 g). Returns null when nothing links the two units.
 */
export function convertPantryAmount(ingredient: string, amount: number, from: string, to: string): Conversion | null {
  const general = sameUnitOrGeneral(from, to);
  if (general !== null) return { amount: amount * general, approximate: false };
  const factors = INGREDIENT_FACTORS[normalizeSearchTerm(ingredient)] ?? {};
  for (const [recipeUnit, { to: pantryUnit, factor, exact }] of Object.entries(factors)) {
    const forwardIn = sameUnitOrGeneral(from, recipeUnit);
    const forwardOut = sameUnitOrGeneral(pantryUnit, to);
    if (forwardIn !== null && forwardOut !== null) {
      return { amount: amount * forwardIn * factor * forwardOut, approximate: !exact };
    }
    const backwardIn = sameUnitOrGeneral(from, pantryUnit);
    const backwardOut = sameUnitOrGeneral(recipeUnit, to);
    if (backwardIn !== null && backwardOut !== null) {
      return { amount: (amount * backwardIn * backwardOut) / factor, approximate: !exact };
    }
  }
  return null;
}

/** One unit the pantry can show an ingredient in, and whether getting there rests on a typical size or density. */
export type UnitChoice = { unit: string; approximate: boolean };

/** The units offered for each kind, in the order the unit chips show them. */
const VOLUME_CHOICES = ['tsp', 'tbsp', 'cup', 'ml', 'l'];
const WEIGHT_CHOICES = ['oz', 'lb', 'g', 'kg'];
/** Count units offered for one ingredient, beyond its pantry unit. */
const COUNT_CHOICES: Record<string, string[]> = { egg: ['dozen'] };

/**
 * The units the pantry can show an ingredient in: its pantry unit first, then the other units of the same kind
 * (volume or weight), then weights when one of its factors reaches a weight, then any extra count units
 * (dozens of eggs). Volumes of another kind are left out: the factors that reach them describe chopped or
 * cooked food (a cup of chopped onion), not what sits in the pantry.
 */
export function pantryUnitChoices(ingredient: string, pantryUnit: string): UnitChoice[] {
  const kind = unitKind(pantryUnit);
  const candidates = [
    ...(kind === 'volume' ? VOLUME_CHOICES : []),
    ...WEIGHT_CHOICES,
    ...(COUNT_CHOICES[normalizeSearchTerm(ingredient)] ?? []),
  ].filter((unit) => unit !== pantryUnit);
  const choices: UnitChoice[] = [{ unit: pantryUnit, approximate: false }];
  for (const unit of candidates) {
    const conversion = convertPantryAmount(ingredient, 1, pantryUnit, unit);
    if (conversion) choices.push({ unit, approximate: conversion.approximate });
  }
  return choices;
}

/**
 * Converts `amount` of an ingredient from the unit a recipe uses to another unit (usually its pantry unit).
 * Returns null when there is no conversion, e.g. from a volume to a weight, or from "to taste".
 */
export function convertAmount(ingredient: string, amount: number, from: string, to: string): Conversion | null {
  if (from === to) return { amount, approximate: false };
  const general = generalFactor(from, to);
  if (general !== null) return { amount: amount * general, approximate: false };
  const specific = INGREDIENT_FACTORS[normalizeSearchTerm(ingredient)]?.[from];
  if (specific?.to !== to) return null;
  return { amount: amount * specific.factor, approximate: !specific.exact };
}
