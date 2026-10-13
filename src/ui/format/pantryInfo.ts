// PRESENTATION LAYER: display text about the user's pantry list.

/** "Find recipes with 1 ingredient", "Find recipes with 8 ingredients". */
export function formatFindRecipesLabel(count: number): string {
  return `Find recipes with ${count} ${count === 1 ? 'ingredient' : 'ingredients'}`;
}

/** The Results subtitle: "Matched against your 1 pantry ingredient", "... your 8 pantry ingredients". */
export function formatMatchedAgainst(count: number): string {
  return `Matched against your ${count} pantry ${count === 1 ? 'ingredient' : 'ingredients'}`;
}

/** Shown when Done is pressed on text that is neither an ingredient nor the start of one. */
export function formatUnknownIngredient(typed: string): string {
  return `“${typed.trim()}” isn’t in our ingredient list.`;
}

/** An ingredient name as the mockup shows it: "green onion" -> "Green Onion", "all-purpose flour" -> "All-purpose Flour". */
export function formatIngredientName(name: string): string {
  return name.replace(/(^|\s)(\S)/g, (_, space: string, letter: string) => space + letter.toUpperCase());
}
