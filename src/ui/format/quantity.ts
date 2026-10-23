// PRESENTATION LAYER: show stored decimal quantities as kitchen fractions.

type Fraction = { value: number; text: string };

/** 0, 1/8, 1/4, 1/3, 3/8, 1/2, … 7/8, 1 — halves, thirds, quarters and eighths. */
const FRACTIONS: Fraction[] = (() => {
  const byValue = new Map<string, Fraction>([
    ['0.0000', { value: 0, text: '' }],
    ['1.0000', { value: 1, text: '' }],
  ]);
  for (const d of [2, 3, 4, 8]) {
    for (let n = 1; n < d; n++) {
      const key = (n / d).toFixed(4);
      if (!byValue.has(key)) byValue.set(key, { value: n / d, text: `${n}/${d}` });
    }
  }
  return [...byValue.values()];
})();

const EXACT_TOLERANCE = 0.02;
const ABOUT_TOLERANCE = 0.05;

/** The kitchen fraction closest to a value between 0 and 1. */
const nearestFraction = (rest: number) =>
  FRACTIONS.reduce((best, f) => (Math.abs(f.value - rest) < Math.abs(best.value - rest) ? f : best));

/** A decimal to 2 places ("2.06"), or a tiny amount to one figure ("0.001") rather than "0". */
const decimalText = (value: number) => {
  const rounded = Number(value.toFixed(2));
  return String(rounded === 0 && value > 0 ? Number(value.toPrecision(1)) : rounded);
};

/**
 * A pantry amount: a kitchen fraction ("1 1/2") when within 0.02 of one, else a decimal to 2 places ("2.06").
 * Unlike formatAmount it never says "about", which wouldn't fit beside the pantry's − / + buttons.
 */
export function formatKitchenAmount(value: number): string {
  let whole = Math.floor(value);
  const rest = value - whole;
  const nearest = nearestFraction(rest);
  if (Math.abs(nearest.value - rest) <= EXACT_TOLERANCE) {
    if (nearest.value === 1) whole += 1;
    const text = [whole > 0 ? String(whole) : '', nearest.text].filter(Boolean).join(' ');
    if (text) return text;
  }
  return decimalText(value);
}

export function formatAmount(value: number): string {
  let whole = Math.floor(value);
  const rest = value - whole;
  const nearest = nearestFraction(rest);
  const diff = Math.abs(nearest.value - rest);
  if (diff > ABOUT_TOLERANCE) return String(Number(value.toFixed(2)));

  if (nearest.value === 1) whole += 1;
  const text = [whole > 0 ? String(whole) : '', nearest.text].filter(Boolean).join(' ');
  if (!text) return String(Number(value.toFixed(2))); // a tiny amount that snapped to 0
  return diff <= EXACT_TOLERANCE ? text : `about ${text}`;
}

/** "2", "3–4", or "" when there is no amount. */
export function formatQuantity(min: number | null, max: number | null): string {
  if (min === null) return '';
  if (max === null || max === min) return formatAmount(min);
  return `${formatAmount(min)}–${formatAmount(max)}`;
}
