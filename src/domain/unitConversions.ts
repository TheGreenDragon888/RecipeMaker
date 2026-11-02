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
    tbsp: { to: 'each', factor: 0.125 / 16 }, // the cup factor / 16
    head: { to: 'each', factor: 1, exact: true }, // "each" is one head
  },
  carrot: {
    cup: { to: 'each', factor: 2 }, // recipe: "2 medium carrots ... (about 1 cup)"; BC
    lb: { to: 'each', factor: 6 }, // recipe: "1/2 lb. carrots (about 3)"
  },
  celery: {
    cup: { to: 'stalk', factor: 2 }, // recipe: "2 celery ribs (finely diced, 1 cup, 105g)"
    tbsp: { to: 'stalk', factor: 0.125 }, // the cup factor / 16
  },
  cucumber: {
    cup: { to: 'each', factor: 0.667 }, // diced; a medium cucumber gives about 1.5 cups (AFME)
    slice: { to: 'each', factor: 0.023 }, // FDC: 1 slice (1/8 in) = 7 g, 1 medium = 301 g
  },
  eggplant: { cup: { to: 'each', factor: 0.25 } }, // diced; a 1 lb eggplant gives about 4 cups (MSU Extension)
  escarole: { head: { to: 'each', factor: 1, exact: true } }, // "each" is one head
  garlic: {
    tbsp: { to: 'clove', factor: 3 }, // minced; a medium clove gives about 1 tsp (AFME)
    tsp: { to: 'clove', factor: 1 }, // the tbsp factor / 3
  },
  ginger: {
    tbsp: { to: 'inch', factor: 1 }, // grated; common rule "1 inch ≈ 1 tbsp" (no authoritative source)
    tsp: { to: 'inch', factor: 1 / 3 }, // the tbsp factor / 3
  },
  'green bell pepper': {
    cup: { to: 'each', factor: 1 }, // chopped; "1 cup chopped = 1 medium" (BC)
    tbsp: { to: 'each', factor: 1 / 16 }, // the cup factor / 16
  },
  'bell pepper': {
    cup: { to: 'each', factor: 1 }, // chopped; as green bell pepper (BC)
    tbsp: { to: 'each', factor: 1 / 16 }, // the cup factor / 16
    slice: { to: 'each', factor: 0.084 }, // FDC: 1 ring (1/4 in) = 10 g, 1 medium = 119 g
  },
  jalapeño: {
    tbsp: { to: 'each', factor: 0.4 }, // FDC: 1 pepper = 14 g, 1 cup sliced = 90 g (5.6 g a tbsp)
    tsp: { to: 'each', factor: 0.4 / 3 }, // the tbsp factor / 3
  },
  'green onion': {
    each: { to: 'stalk', factor: 1, exact: true }, // the recipe data's "each" is one whole green onion
    cup: { to: 'stalk', factor: 8 }, // recipe: "1/4 cup sliced scallions (about two)"
    tbsp: { to: 'stalk', factor: 0.5 }, // the cup factor / 16
    bunch: { to: 'stalk', factor: 7 }, // a bunch holds about 6-8 (AFME)
  },
  onion: {
    cup: { to: 'each', factor: 1 }, // chopped medium onion
    tbsp: { to: 'each', factor: 1 / 16 }, // the cup factor / 16
    oz: { to: 'each', factor: 0.258 }, // FDC: 1 medium = 110 g
  },
  'white onion': {
    cup: { to: 'each', factor: 1 }, // chopped medium onion, as onion
    tbsp: { to: 'each', factor: 1 / 16 }, // the cup factor / 16
  },
  'yellow onion': { cup: { to: 'each', factor: 1 } }, // chopped medium onion, as onion
  'red onion': {
    cup: { to: 'each', factor: 1 }, // recipe: "½ small red onion (finely diced, 80g, ½ cup)"
    tbsp: { to: 'each', factor: 1 / 16 }, // the cup factor / 16
  },
  tomato: {
    cup: { to: 'each', factor: 4 / 3 }, // chopped; a medium tomato gives about 3/4 cup
    slice: { to: 'each', factor: 0.16 }, // FDC: 1 slice (1/4 in) = 20 g, 1 medium = 123 g
  },
  'plum tomato': { lb: { to: 'each', factor: 7.3 } }, // FDC: 1 plum tomato = 62 g
  apple: { cup: { to: 'each', factor: 0.69 } }, // FDC 171688: 1 cup chopped = 125 g, 1 medium = 182 g
  'dill pickle': { cup: { to: 'each', factor: 2.2 } }, // FDC: 1 cup chopped = 143 g, 1 medium = 65 g
  'butternut squash': { lb: { to: 'each', factor: 0.5 } }, // recipe: "1 medium butternut squash (about 2 pounds)"
  'delicata squash': { inch: { to: 'each', factor: 0.125 } }, // a delicata is about 8 in long (no authoritative source)
  'sweet potato': {
    lb: { to: 'each', factor: 2 }, // recipe: "1 medium sweet potato ... (8 ounces)"
    oz: { to: 'each', factor: 1 / 8 }, // the same 8 oz sweet potato
  },
  'yellow squash': { cup: { to: 'each', factor: 0.575 } }, // FDC 2709807: 1 cup = 115 g, 1 squash = 200 g
  zucchini: { cup: { to: 'each', factor: 0.63 } }, // cubed; a medium zucchini of 196 g gives about 1.6 cups (FDC)
  'baby potato': {
    lb: { to: 'each', factor: 14 }, // baby potatoes of about 1-1.3 oz
    bag: { to: 'each', factor: 21 }, // recipe: "24 oz bag baby potatoes", at the lb factor
  },
  'red potato': {
    lb: { to: 'each', factor: 10 / 3 }, // recipe: "1-1/2 pounds red potatoes (about 5 medium)"
    oz: { to: 'each', factor: 10 / 3 / 16 }, // the lb factor / 16
  },
  'russet potato': { lb: { to: 'each', factor: 2 } }, // recipe: "1 pound potatoes (about 2 medium)"; FDC 1 medium = 213 g
  'yukon gold potato': { lb: { to: 'each', factor: 2.1 } }, // FDC: 1 medium potato = 213 g

  // Produce counted by weight (sold in labelled packages)
  mushroom: {
    cup: { to: 'oz', factor: 2.47 }, // FDC 169251: 1 cup pieces = 70 g
    each: { to: 'oz', factor: 0.635 }, // FDC 169251: 1 medium = 18 g
  },
  'white mushroom': { each: { to: 'oz', factor: 0.635 } }, // FDC 169251: 1 medium = 18 g
  'portobello mushroom': {
    cup: { to: 'oz', factor: 3.03 }, // FDC 169255: 1 cup diced = 86 g
    each: { to: 'oz', factor: 8 / 3 }, // recipe: "3 portobello mushroom caps (about ½ lb.)"
  },
  broccoli: {
    cup: { to: 'lb', factor: 0.16 }, // FDC: 1 cup florets = 71 g
    each: { to: 'lb', factor: 0.019 }, // recipe: "6-7 broccoli florets, about 2 oz"
    head: { to: 'lb', factor: 1 }, // a crown is about 1 lb (FDC: 1 stalk = 151 g; crowns sell at 12-16 oz)
  },
  'green bean': { cup: { to: 'lb', factor: 0.22 } }, // FDC: 1 cup 1/2-in pieces = 100 g
  kale: { each: { to: 'cup', factor: 1 } }, // a large leaf is about 40 g; recipe: "1/2 lb chopped fresh kale (about 6 cups)"
  lettuce: { each: { to: 'cup', factor: 0.5 } }, // a leaf, torn; FDC: romaine leaf 28 g / 1 cup 47 g, iceberg leaf 8 g / 1 cup 72 g
  'kalamata olive': {
    cup: { to: 'oz', factor: 4.76 }, // FDC 2710090 (olives): 1 cup = 135 g
    each: { to: 'oz', factor: 0.176 }, // FDC 2710090: 1 olive = 5 g
    jar: { to: 'oz', factor: 6, exact: true }, // recipe: "1 6oz. jar" (drained weight on the label)
  },
  arugula: { oz: { to: 'cup', factor: 1.4 } }, // loose leaves; FDC: 1/2 cup = 10 g
  spinach: { oz: { to: 'cup', factor: 0.95 } }, // loose raw leaves; 1 cup = 30 g (FDC)

  // Meat and fish
  bacon: {
    oz: { to: 'slice', factor: 1.125 }, // regular cut, about 18 slices per lb
    lb: { to: 'slice', factor: 18 }, // the oz factor × 16
  },
  'chicken thigh': {
    lb: { to: 'each', factor: 4 }, // boneless, about 4 oz each; recipes: "(3 to 4-ounce)", "(4 to 6-ounce)"
    oz: { to: 'each', factor: 0.25 }, // the same 4 oz thigh
  },
  chicken: { oz: { to: 'cup', factor: 0.2 } }, // cooked, diced; FDC: 1 cup = 140 g
  'pork chop': { oz: { to: 'each', factor: 1 / 5.5 } }, // recipe: "1 (5 to 6-ounce) boneless pork chop"
  'salmon fillet': { oz: { to: 'each', factor: 0.2 } }, // recipe: "10 salmon fillets (5 ounces each)"
  salami: { slice: { to: 'oz', factor: 0.35 } }, // FDC: 1 slice = 10 g (thin-cut slices are smaller)
  ham: {
    oz: { to: 'cup', factor: 0.2 }, // diced; FDC: 1 cup = 140 g; recipe: "½ cup cooked cubed ham (2.5 oz)"
    lb: { to: 'cup', factor: 3.2 }, // the oz factor × 16
    slice: { to: 'cup', factor: 0.2 }, // recipe: "1 slice deli ham (about 1 ounce)", at the oz factor
  },
  'deli turkey': { cup: { to: 'oz', factor: 4.9 } }, // chopped; FDC (turkey, diced): 1 cup = 140 g
  'breakfast sausage': {
    link: { to: 'oz', factor: 0.9 }, // a precooked breakfast link of about 25 g (label)
    cup: { to: 'oz', factor: 3.9 }, // cooked crumbles: about 2.6 oz per 2/3 cup (label)
  },
  'chicken sausage': { link: { to: 'oz', factor: 3 } }, // recipe: "4 fully-cooked chicken sausage links (about 12 oz.)"
  'smoked sausage': { oz: { to: 'package', factor: 1 / 14 } }, // recipe: "1 package (14 ounces) smoked sausage"
  'chicken breast': {
    lb: { to: 'each', factor: 16 / 6 }, // recipe: "4- (6-ounce) boneless chicken breasts"
    oz: { to: 'each', factor: 1 / 6 }, // a 6 oz breast
    cup: { to: 'each', factor: 1.1 }, // cooked, diced: 140 g per cup; a 6 oz raw breast cooks to about 125-130 g
  },
  'italian sausage': {
    lb: { to: 'link', factor: 4.25 }, // recipe: "14 links ... approx. 3-3 ½ lbs"
    oz: { to: 'link', factor: 4.25 / 16 }, // the lb factor / 16
    package: { to: 'link', factor: (19 * 4.25) / 16 }, // recipe: "1 package (19 ounces) Italian sausage links"
  },
  pepperoni: { slice: { to: 'oz', factor: 0.067 } }, // standard pizza pepperoni, about 2 g a slice
  shrimp: { each: { to: 'lb', factor: 0.04 } }, // jumbo, about 25 per lb (recipe: "Jumbo 21/25")

  // Cheese
  'american cheese': { oz: { to: 'slice', factor: 1.5 } }, // wrapped singles of about 19 g
  cheese: {
    slice: { to: 'oz', factor: 0.67 }, // a deli slice of about 19 g
    cup: { to: 'oz', factor: 4 }, // shredded; FDC (cheddar): 1 cup = 113 g
  },
  'monterey jack cheese': { oz: { to: 'cup', factor: 0.25 } }, // shredded; FDC: 1 cup = 113 g
  'pepper jack cheese': { cup: { to: 'oz', factor: 4 } }, // shredded; FDC (Monterey Jack): 1 cup = 113 g
  'swiss cheese': {
    cup: { to: 'oz', factor: 3.8 }, // shredded; FDC: 1 cup = 108 g
    slice: { to: 'oz', factor: 0.67 }, // a deli slice of about 19 g, as cheese
  },
  'mozzarella cheese': {
    oz: { to: 'cup', factor: 0.25 }, // recipe: "4 oz. shredded mozzarella (about 1 cup, or 100 g)"
    slice: { to: 'cup', factor: 0.19 }, // a 3/4 oz slice, at the oz factor
  },
  'provolone cheese': {
    oz: { to: 'slice', factor: 4 / 3 }, // a deli slice of about 3/4 oz (21 g)
    cup: { to: 'slice', factor: 16 / 3 }, // shredded, 4 oz a cup, at the oz factor
  },
  'parmesan cheese': { oz: { to: 'cup', factor: 0.35 } }, // shredded; FDC: 1 tbsp = 5 g, so 1 cup = 80 g
  'cream cheese': { tbsp: { to: 'oz', factor: 0.51 } }, // FDC: 1 tbsp = 14.5 g
  'ricotta cheese': { oz: { to: 'cup', factor: 0.115 } }, // FDC: 1 cup = 246 g
  'cottage cheese': { oz: { to: 'cup', factor: 0.125 } }, // FDC: 1 cup = 226 g
  'sour cream': {
    oz: { to: 'cup', factor: 0.123 }, // FDC: 1 cup = 230 g
    container: { to: 'cup', factor: 1.97 }, // recipe: "16 ounce container of sour cream", at the oz factor
  },
  'cheddar cheese': {
    oz: { to: 'cup', factor: 0.25 }, // recipe: "2 oz. cheddar, shredded (about ½ cup)"
    slice: { to: 'cup', factor: 0.19 }, // a 3/4 oz slice, at the oz factor
  },
  'feta cheese': {
    cup: { to: 'oz', factor: 5.3 }, // crumbled: 1 cup = 150 g
    tbsp: { to: 'oz', factor: 5.3 / 16 }, // the cup factor / 16
  },
  'fresh mozzarella cheese': { cup: { to: 'oz', factor: 4.66 } }, // FDC 2705722: 1 cup diced = 132 g

  // Pasta, bread and snacks
  'egg noodle': {
    package: { to: 'oz', factor: 12, exact: true }, // recipe: "1 (12 ounce) package"
    cup: { to: 'oz', factor: 1.34 }, // dry: 1 cup = 38 g
  },
  'elbow macaroni': {
    lb: { to: 'cup', factor: 3.72 }, // dry: 1 cup = 122 g (USDA)
    oz: { to: 'cup', factor: 3.72 / 16 }, // the lb factor / 16
    box: { to: 'cup', factor: 1.86 }, // recipe: "1 (8 ounce) box", at the lb factor
  },
  pasta: {
    cup: { to: 'lb', factor: 0.25 }, // dry; recipe: "2 cups (8 ounces) uncooked elbow macaroni"
    each: { to: 'lb', factor: 0.019 }, // a dry jumbo shell of about 8.5 g (label: 56 g is about 6-7 shells)
  },
  orzo: { lb: { to: 'cup', factor: 2 } }, // dry; label: 1/4 cup = 56 g
  fettuccine: { package: { to: 'lb', factor: 1, exact: true } }, // recipe: "1 (16 ounce) package"
  'french bread': { slice: { to: 'loaf', factor: 0.05 } }, // thick slices from a 24-inch loaf, about 20 a loaf
  'pizza dough': {
    container: { to: 'each', factor: 1, exact: true }, // "each" is one ball or tube
    lb: { to: 'each', factor: 1 }, // store dough balls are usually 1 lb
  },
  cracker: { each: { to: 'sleeve', factor: 1 / 32 } }, // Ritz-style, 32 a sleeve
  'mini pretzel': { each: { to: 'cup', factor: 0.0375 } }, // FDC 2708248: 1 mini = 1.5 g, 1 cup = 40 g
  'sourdough pretzel': { cup: { to: 'each', factor: 3 } }, // chopped pieces: 1 oz = 1 pretzel, about 1/3 cup
  'tortilla chip': {
    package: { to: 'bag', factor: 1, exact: true }, // a package of chips is one bag
    oz: { to: 'bag', factor: 1 / 13 }, // a 13 oz bag (label)
    cup: { to: 'bag', factor: 1 / 13 }, // crushed, about 1 oz a cup, at the oz factor
    each: { to: 'bag', factor: 0.1 / 13 }, // label: 1 oz is about 10 chips, at the oz factor
  },
  'french fried onions': { can: { to: 'cup', factor: 1.4 } }, // a 2.8 oz can; label: 2 tbsp = 7 g

  // Frozen vegetables
  'frozen broccoli': {
    lb: { to: 'cup', factor: 5.3 }, // florets: 1 cup = 85 g (label)
    oz: { to: 'cup', factor: 5.3 / 16 }, // the lb factor / 16
    package: { to: 'cup', factor: 2.9 }, // a 16 oz package, chopped: 1 cup = 156 g (FDC 169968)
  },
  'frozen mixed vegetables': {
    oz: { to: 'cup', factor: 0.215 }, // label: 2/3 cup = 88 g
    package: { to: 'cup', factor: 16 * 0.215 }, // recipe: "1 package (16 ounces)", at the oz factor
  },
  'frozen spinach': {
    lb: { to: 'cup', factor: 1.8 }, // chopped, packed: label 1/3 cup = 83 g
    oz: { to: 'cup', factor: 1.8 / 16 }, // the lb factor / 16
    package: { to: 'cup', factor: (10 * 1.8) / 16 }, // recipe: "1 (10 oz) package", at the lb factor
  },
  'frozen peas': { oz: { to: 'cup', factor: 0.21 } }, // FDC: 1 cup = 134 g
  'frozen stir-fry vegetables': {
    oz: { to: 'cup', factor: 1 / 3 }, // label: 1 cup = 85 g
    package: { to: 'cup', factor: 16 / 3 }, // recipe: "1 package (16 ounces)", at the oz factor
  },
  'coleslaw mix': { cup: { to: 'bag', factor: 1 / 7 } }, // a 14 oz bag; label: 1 1/2 cups = 85 g

  // Cans, jars and cubes
  'canned tuna': {
    oz: { to: 'can', factor: 0.2 }, // recipe: "five 5-ounce cans"
    jar: { to: 'can', factor: 1.3 }, // recipe: "1 (6.5 ounce) jar", in 5 oz cans
  },
  'chicken bouillon cube': { cube: { to: 'each', factor: 1, exact: true } }, // one cube is one
  'coconut milk': {
    can: { to: 'cup', factor: 1.69 }, // recipe: "1 13.5oz. can"
    oz: { to: 'cup', factor: 1.69 / 13.5 }, // the can factor / 13.5
  },
  corn: {
    can: { to: 'cup', factor: 1.5 }, // a 15.25 oz can, drained
    oz: { to: 'cup', factor: 0.17 }, // FDC (canned, drained): 1 cup = 165 g
  },
  'marinara sauce': {
    jar: { to: 'cup', factor: 3 }, // recipe: "1 (26 ounce) jar"
    oz: { to: 'cup', factor: 3 / 26 }, // the jar factor / 26
  },
  salsa: {
    jar: { to: 'cup', factor: 2 }, // recipe: "1 16oz. jar"
    oz: { to: 'cup', factor: 2 / 16 }, // the jar factor / 16
  },
  'salsa verde': { oz: { to: 'cup', factor: 2 / 16 } }, // as salsa: recipe "1 (16 oz.) jar salsa verde"
  'pizza sauce': { oz: { to: 'cup', factor: 0.112 } }, // label: 1/4 cup = 63 g
  'tomato paste': {
    oz: { to: 'tbsp', factor: 1.77 }, // FDC: 1 tbsp = 16 g
    can: { to: 'tbsp', factor: 6 * 1.77 }, // recipe: "1 can (6 ounces) tomato paste", at the oz factor
  },
  'tomato sauce': {
    oz: { to: 'can', factor: 1 / 8 }, // recipe: "1 can (8 ounces) tomato sauce"
    cup: { to: 'can', factor: 1.08 }, // FDC: 1 cup = 245 g; an 8 oz can is 227 g
    tbsp: { to: 'can', factor: 1.08 / 16 }, // the cup factor / 16
  },
  'crushed tomatoes': {
    oz: { to: 'cup', factor: 0.117 }, // FDC: 1 cup = 242 g
    can: { to: 'cup', factor: 28 * 0.117 }, // recipe: "1 (28-ounce) can crushed tomatoes", at the oz factor
  },
  'canned diced tomatoes': {
    oz: { to: 'can', factor: 1 / 14.5 }, // a 14.5 oz can; recipe: "1 can (14-1/2 ounces) diced tomatoes"
    cup: { to: 'can', factor: 0.584 }, // FDC: 1 cup = 240 g; a 14.5 oz can is 411 g
    jar: { to: 'can', factor: 1 }, // recipe: "1 jar diced tomatoes" gives no size; taken as one can's worth
  },
  'canned diced tomatoes with green chiles': { oz: { to: 'can', factor: 0.1 } }, // recipe: "1 can (10 ounces)"
  'canned diced green chiles': { oz: { to: 'can', factor: 0.25 } }, // recipe: "two 4-oz cans"
  'canned stewed tomatoes': { oz: { to: 'can', factor: 1 / 14.5 } }, // recipe: "4 cans (14-1/2 ounces each)"
  'canned whole tomatoes': { oz: { to: 'can', factor: 1 / 28 } }, // recipe: "1 (28 oz) can whole tomatoes"
  'canned mushrooms': { oz: { to: 'can', factor: 0.25 } }, // a 4 oz can (label); recipe: "1 can (4 ounces) mushroom stems"
  'condensed cream of mushroom soup': { oz: { to: 'can', factor: 1 / 10.5 } }, // recipe: "1 (10.5 ounce) can"
  'condensed tomato soup': { oz: { to: 'can', factor: 1 / 10.75 } }, // recipe: "1 can tomato soup (10.75 oz)"
  'artichoke hearts': { oz: { to: 'can', factor: 1 / 14 } }, // recipe: "1 can (14 ounces) ... artichoke hearts"
  'refrigerated biscuit dough': { oz: { to: 'can', factor: 1 / 16.3 } }, // recipe: "16.3 ounces refrigerated biscuits (1 can)"
  'roasted red pepper': { jar: { to: 'oz', factor: 12 } }, // recipe: "1/2 of a 12 oz jar roasted red peppers"
  'black olive': { cup: { to: 'can', factor: 0.79 } }, // a 6 oz can; FDC (olives): 1 cup = 135 g
  sauerkraut: { oz: { to: 'cup', factor: 0.2 } }, // FDC (canned): 1 cup = 142 g
  hummus: { oz: { to: 'cup', factor: 0.115 } }, // FDC: 1 cup = 246 g
  'enchilada sauce': {
    can: { to: 'oz', factor: 10 }, // recipe: "3 cans (10 ounces each) green enchilada sauce"
    cup: { to: 'oz', factor: 8.5 }, // label: 1/4 cup = 60 g
  },
  'refried beans': {
    oz: { to: 'can', factor: 1 / 16 }, // recipe: "16 ounces refried beans (1 can)"
    cup: { to: 'can', factor: 0.556 }, // FDC: 1 cup = 252 g; a 16 oz can is 454 g
  },
  'black bean': {
    oz: { to: 'can', factor: 1 / 15 }, // recipe: "1 can (15 ounces) black beans"
    cup: { to: 'can', factor: 2 / 3 }, // a 15 oz can holds about 1 1/2 cups drained (label)
    tbsp: { to: 'can', factor: 2 / 3 / 16 }, // the cup factor / 16
  },
  'kidney bean': {
    oz: { to: 'can', factor: 1 / 15 }, // recipe: "1 (15 oz.) can kidney beans"
    cup: { to: 'can', factor: 2 / 3 }, // as black bean: about 1 1/2 cups drained a can (label)
  },
  chickpea: {
    oz: { to: 'can', factor: 1 / 15 }, // recipe: "1 15 oz. can chickpeas"
    cup: { to: 'can', factor: 2 / 3 }, // as black bean: about 1 1/2 cups drained a can (label)
  },
  'cannellini bean': { cup: { to: 'can', factor: 2 / 3 } }, // as black bean: about 1 1/2 cups drained a can (label)
  'white bean': {
    oz: { to: 'can', factor: 1 / 15 }, // recipe: "1 (15 oz) can cannellini beans"
    cup: { to: 'can', factor: 2 / 3 }, // as black bean: about 1 1/2 cups drained a can (label)
  },
  'pinto bean': { oz: { to: 'can', factor: 1 / 15 } }, // recipe: "1 (15 oz.) can pinto beans"

  // Liquids measured in ounces (fluid ounces: 8 to a cup), cans of broth, juice from fruit
  'beef broth': {
    oz: { to: 'cup', factor: 1 / 8 }, // fluid ounces; broth weighs about the same as water
    can: { to: 'cup', factor: 1.8 }, // a 14.5 oz can (label: about 2 servings of 1 cup)
  },
  'chicken broth': { can: { to: 'cup', factor: 1.8 } }, // a 14.5 oz can, as beef broth
  'vegetable broth': {
    oz: { to: 'cup', factor: 1 / 8 }, // recipe: "1 carton (32 ounces)", which is 4 cups
    can: { to: 'cup', factor: 1.8 }, // a 14.5 oz can, as beef broth
  },
  'white wine': { oz: { to: 'cup', factor: 1 / 8 } }, // fluid ounces
  'tomato juice': { oz: { to: 'cup', factor: 1 / 8 } }, // fluid ounces; recipe: "1 bottle (46 ounces) V8 juice"
  'buffalo wing sauce': { cup: { to: 'bottle', factor: 2 / 3 } }, // a 12 fl oz bottle is 1 1/2 cups (label)
  'lemon juice': { each: { to: 'tbsp', factor: 3 } }, // FDC: the juice of 1 lemon = 48 g, about 3 tbsp
  'lime juice': { each: { to: 'tbsp', factor: 2 } }, // a medium lime gives about 2 tbsp (common kitchen yield)
  'egg white': { cup: { to: 'each', factor: 7.4 } }, // FDC: 1 large white = 33 g, 1 cup = 243 g

  // Seasoning packets
  'taco seasoning': {
    tbsp: { to: 'package', factor: 0.3 }, // a 1 oz packet is about 10 tsp (label: 2 tsp a serving, about 5 servings)
    tsp: { to: 'package', factor: 0.1 }, // the same packet
  },
  'ranch seasoning mix': { tbsp: { to: 'package', factor: 1 / 3 } }, // a 1 oz packet is about 3 tbsp
  'cherry tomato': {
    each: { to: 'cup', factor: 0.1 }, // halved; about 17 g each
    lb: { to: 'cup', factor: 3.04 }, // FDC: 1 cup = 149 g
  },
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
