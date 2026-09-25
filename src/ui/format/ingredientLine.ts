// PRESENTATION LAYER: render one ingredient as a readable line, e.g. "3 cloves garlic, minced".
import type { RecipeIngredient } from '../../domain/recipe';
import { formatQuantity } from './quantity';

/** Units whose names are pluralized at any quantity: "1 can chickpeas". */
const CONTAINER_UNITS = new Set(['can', 'jar', 'package', 'bag', 'box', 'bottle', 'container']);
/** Units shown after the name, with no amount: "salt, to taste". */
const NO_AMOUNT_UNITS = new Set(['to taste', 'as needed']);
const UNCHANGED_UNITS = new Set(['tsp', 'tbsp', 'oz', 'lb']);
const IRREGULAR_NAMES: Record<string, string> = { jalapeño: 'jalapeños' };
const IRREGULAR_UNITS: Record<string, string> = { loaf: 'loaves' };

/** Ingredient names are stored singular; names already ending in "s" ("rolled oats") are left alone. */
export function pluralizeName(name: string): string {
  if (IRREGULAR_NAMES[name]) return IRREGULAR_NAMES[name];
  if (name.endsWith('s')) return name;
  if (/[^aeiou]y$/.test(name)) return `${name.slice(0, -1)}ies`;
  if (/(ch|sh|o)$/.test(name)) return `${name}es`;
  return `${name}s`;
}

export function pluralizeUnit(unit: string): string {
  if (UNCHANGED_UNITS.has(unit)) return unit;
  if (IRREGULAR_UNITS[unit]) return IRREGULAR_UNITS[unit];
  if (/(ch|sh|x|s)$/.test(unit)) return `${unit}es`;
  return `${unit}s`;
}

export function formatIngredientLine(ing: RecipeIngredient): string {
  const isPlural = (ing.quantityMax ?? ing.quantityMin ?? 0) > 1;
  const preparation = ing.preparation ? `, ${ing.preparation}` : '';
  const optional = ing.isOptional ? ' (optional)' : '';
  const substitute = ing.substitute ? ` — or ${ing.substitute}` : '';

  if (NO_AMOUNT_UNITS.has(ing.unit)) {
    return `${ing.ingredient}${preparation}, ${ing.unit}${optional}${substitute}`;
  }

  const pluralName = CONTAINER_UNITS.has(ing.unit) || (ing.unit === 'each' && isPlural);
  const name = pluralName ? pluralizeName(ing.ingredient) : ing.ingredient;
  const unit = ing.unit === 'each' ? '' : isPlural ? pluralizeUnit(ing.unit) : ing.unit;
  const amount = [formatQuantity(ing.quantityMin, ing.quantityMax), unit, name].filter(Boolean).join(' ');
  return `${amount}${preparation}${optional}${substitute}`;
}
