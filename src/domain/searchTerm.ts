// BUSINESS LAYER: how user-typed ingredient text is normalized before any lookup.

/** Trims, lowercases and collapses runs of whitespace: "  Chick   PEAS " -> "chick peas". */
export function normalizeSearchTerm(raw: string): string {
  return raw.trim().toLowerCase().replace(/\s+/g, ' ');
}
