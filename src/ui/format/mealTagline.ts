// PRESENTATION LAYER: the playful line beside the pantry title, picked by the hour of the day (0–23).

export function formatMealTagline(hour: number): string {
  if (hour >= 5 && hour < 11) return "what's for breakfast?";
  if (hour >= 11 && hour < 15) return "what's for lunch?";
  if (hour >= 15 && hour < 17) return 'time for a snack?';
  if (hour >= 17 && hour < 22) return "what's for dinner?";
  return 'midnight snack?';
}
