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

export function formatAmount(value: number): string {
  let whole = Math.floor(value);
  const rest = value - whole;
  const nearest = FRACTIONS.reduce((best, f) =>
    Math.abs(f.value - rest) < Math.abs(best.value - rest) ? f : best,
  );
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
