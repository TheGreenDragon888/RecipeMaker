// PRESENTATION LAYER: turn screen data into route params and back. Expo Router params are always
// strings (or string[] when a key repeats), and it comma-joins arrays, so the pantry travels as JSON.

type RouteParam = string | string[] | undefined;

export function pantryToParam(pantry: string[]): string {
  return JSON.stringify(pantry);
}

/** The pantry list from the URL, or an empty list when the param is missing or not a JSON list of text. */
export function pantryFromParam(value: RouteParam): string[] {
  if (typeof value !== 'string') return [];
  try {
    const parsed: unknown = JSON.parse(value);
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string')) return parsed;
  } catch {
    // Malformed JSON falls through to the empty list.
  }
  return [];
}

/** Where a recipe lives: the "/recipe/[id]" route with the id as text, for router.push. */
export function recipeHref(recipeId: number) {
  return { pathname: '/recipe/[id]', params: { id: String(recipeId) } } as const;
}

/** The recipe id from the URL, or null unless the param is a plain whole number like "42". */
export function recipeIdFromParam(value: RouteParam): number | null {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  return Number(value);
}
