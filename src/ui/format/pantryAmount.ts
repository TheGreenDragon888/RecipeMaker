// PRESENTATION LAYER: display text for pantry amounts and the amount sheet: amounts rounded for their unit,
// the number field's text (and reading it back), the sheet's header, chips and button labels.
import { formatPantryUnit } from './pantryInfo';
import { formatKitchenAmount } from './quantity';

/** Metric units shown as whole numbers (one decimal under 10): "473 mL", "4.9 g". */
const WHOLE_METRIC = new Set(['ml', 'g']);
/** Metric units shown to 2 decimals: "0.47 L", "1.5 kg". */
const DECIMAL_METRIC = new Set(['l', 'kg']);

/** A number rounded to `places` decimals, or to one figure when that would round a real amount to "0". */
function rounded(amount: number, places: number): string {
  const value = Number(amount.toFixed(places));
  return String(value === 0 && amount > 0 ? Number(amount.toPrecision(1)) : value);
}

function metricText(amount: number, unit: string | null): string | null {
  if (unit !== null && WHOLE_METRIC.has(unit)) return amount >= 10 ? String(Math.round(amount)) : rounded(amount, 1);
  if (unit !== null && DECIMAL_METRIC.has(unit)) return rounded(amount, 2);
  return null;
}

/**
 * A pantry amount rounded for its unit, so 31.9999 tbsp shows as "32": whole mL and g, L and kg to 2 decimals,
 * and kitchen fractions for the rest ("1 1/2"). An approximate amount starts with "≈".
 */
export function formatPantryAmount(amount: number, unit: string | null, approximate = false): string {
  const text = metricText(amount, unit) ?? formatKitchenAmount(amount);
  return approximate ? `≈ ${text}` : text;
}

/** The amount as the sheet's number field writes it: a plain decimal ("0.25"), as the number pad has no "/". */
export function formatAmountForInput(amount: number, unit: string | null): string {
  return metricText(amount, unit) ?? rounded(amount, 2);
}

/** Reads the number field: "1.5", "1,5", ".5" and " 2 " are numbers; anything else ("1/2", "") is null. */
export function parseAmountText(text: string): number | null {
  const trimmed = text.trim().replace(',', '.');
  return /^(\d+\.?\d*|\.\d+)$/.test(trimmed) ? Number(trimmed) : null;
}

/** An amount and its unit: "2 cloves", "≈ 6 oz", "3" when there is no unit. */
function amountWithUnit(amount: number, unit: string | null, approximate = false): string {
  const unitText = formatPantryUnit(amount, unit);
  const amountText = formatPantryAmount(amount, unit, approximate);
  return unitText ? `${amountText} ${unitText}` : amountText;
}

/** The sheet's badge: "Now 2 cloves". */
export function formatNowBadge(amount: number, unit: string | null, approximate = false): string {
  return `Now ${amountWithUnit(amount, unit, approximate)}`;
}

/** The sheet's subtitle, from the ingredient's pantry unit: "Counted in cloves". */
export function formatCountedIn(unit: string | null): string {
  if (unit === null) return 'No unit';
  if (unit === 'each') return 'Counted one at a time';
  return `Counted in ${formatPantryUnit(2, unit)}`;
}

/** A unit chip's label, in the plural: "cups", "tbsp", "mL", "each". */
export function formatUnitChoice(unit: string): string {
  return formatPantryUnit(2, unit) ?? unit;
}

/** The label of a row's amount button, which opens the sheet. */
export function formatEditAmountLabel(name: string, hasOtherUnits: boolean): string {
  return hasOtherUnits ? `Edit amount and unit for ${name}` : `Edit amount for ${name}`;
}

/** The label of the sheet's −5 / −1 / +1 / +5 buttons: "Subtract 5 cups", "Add 1 tbsp". */
export function formatSheetStepLabel(step: number, unit: string | null): string {
  const size = Math.abs(step);
  const unitText = formatPantryUnit(size, unit);
  return `${step < 0 ? 'Subtract' : 'Add'} ${size}${unitText ? ` ${unitText}` : ''}`;
}

/**
 * The label of a row's − / + button. A step is 1 of the unit shown ("Increase flour quantity"), except for
 * an item shown in mL or g, which steps 1 of its pantry unit: then that unit is named ("Decrease milk by 1 cup").
 */
export function formatQuantityStepLabel(direction: 'increase' | 'decrease', name: string, stepUnit: string | null): string {
  const verb = direction === 'increase' ? 'Increase' : 'Decrease';
  return stepUnit === null ? `${verb} ${name} quantity` : `${verb} ${name} by 1 ${formatPantryUnit(1, stepUnit)}`;
}

/** Shown under the field when the amount is over the limit: "Up to 1584 tbsp". */
export function formatAmountLimit(limit: number, unit: string | null): string {
  return `Up to ${amountWithUnit(limit, unit)}`;
}

/** Shown under the unit chips when the picked unit rests on a typical size or density. */
export const ESTIMATE_NOTE = '≈ Estimated from a typical size';
