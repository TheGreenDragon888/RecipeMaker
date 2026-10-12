// PRESENTATION LAYER: which part of an autocomplete suggestion the user already typed (shown in bold).
import { normalizeSearchTerm } from '../../domain/searchTerm';

export type PrefixSplit = { match: string; rest: string };

/**
 * Splits "tomato paste" typed as "tom" into { match: "tom", rest: "ato paste" }. The typed text is
 * normalized the same way the suggestion service normalizes it. Returns null when the suggestion
 * does not start with it, which happens when it matched through an alias ("to" → "sesame oil").
 */
export function splitOnTypedPrefix(suggestion: string, typed: string): PrefixSplit | null {
  const prefix = normalizeSearchTerm(typed);
  if (!prefix || !suggestion.toLowerCase().startsWith(prefix)) return null;
  return { match: suggestion.slice(0, prefix.length), rest: suggestion.slice(prefix.length) };
}
