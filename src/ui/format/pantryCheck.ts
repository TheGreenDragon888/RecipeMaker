// PRESENTATION LAYER: display text for a recipe line's pantry check: the note beside it ("have 6 cloves"), the
// line under it ("Not in your pantry"), what screen readers hear, and the circles and legend that show it.
import type { ShownAmount } from '../../domain/pantry';
import type { PantryCheck } from '../../domain/pantryCheck';
import { formatPantryAmount } from './pantryAmount';
import { formatPantryUnit } from './pantryInfo';

/** The circle a line is drawn with: a green check, blue swap arrows, an amber dash, or a clay cross. */
export type CheckMark = 'have' | 'swap' | 'notEnough' | 'missing';

const LEGEND_ORDER: CheckMark[] = ['have', 'swap', 'notEnough', 'missing'];
const LEGEND_LABELS: Record<CheckMark, string> = { have: 'Have', swap: 'Swap', notEnough: 'Not enough', missing: 'Missing' };

/** "6 cloves", "1/2 cup", "≈ 2 tbsp"; "2" for things counted one at a time, as the recipe lines write them. */
function amountText({ amount, unit, approximate }: ShownAmount): string {
  const number = formatPantryAmount(amount, unit, approximate);
  const unitText = unit === 'each' ? null : formatPantryUnit(amount, unit);
  return unitText ? `${number} ${unitText}` : number;
}

/** The note beside a line: "have 6 cloves", or "staple". Short, swapped and missing lines say it underneath instead. */
export function formatCheckNote(check: PantryCheck): string | null {
  if (check.status === 'staple') return 'staple';
  return check.status === 'have' && check.have ? `have ${amountText(check.have)}` : null;
}

/** The line under a recipe line that is short, swapped or missing. */
export function formatCheckDetail(check: PantryCheck): string | null {
  switch (check.status) {
    case 'notEnough':
      return `Not enough — have ${amountText(check.have)}, need ${amountText(check.short)} more`;
    case 'swap':
      return check.have ? `Swap: use ${check.substitute} — you have ${amountText(check.have)}` : `Swap: use ${check.substitute}`;
    case 'missing':
      return 'Not in your pantry';
    default:
      return null;
  }
}

/** What screen readers hear after the line, since they skip the circle. */
export function formatCheckLabel(check: PantryCheck): string {
  switch (check.status) {
    case 'have':
      return check.have ? `In your pantry, have ${amountText(check.have)}` : 'In your pantry';
    case 'staple':
      return 'Kitchen staple, assumed on hand';
    case 'optional':
      return 'Not in your pantry';
    default:
      return formatCheckDetail(check) ?? '';
  }
}

/** The circle a line gets: a staple shares the green check, and an optional line the pantry lacks gets none. */
export function checkMark(check: PantryCheck): CheckMark | null {
  if (check.status === 'staple') return 'have';
  return check.status === 'optional' ? null : check.status;
}

/** The legend's chips: each circle the checks use, once, in the board's order. */
export function legendMarks(checks: PantryCheck[]): CheckMark[] {
  const used = new Set(checks.map(checkMark));
  return LEGEND_ORDER.filter((mark) => used.has(mark));
}

export function formatLegendLabel(mark: CheckMark): string {
  return LEGEND_LABELS[mark];
}
