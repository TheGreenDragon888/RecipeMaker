// PRESENTATION LAYER: the shared look, taken from the Claude Design board ("RecipeMaker — Current Mockup").
// Screens and components use these names instead of repeating hex values or pixel sizes.

export const colors = {
  /** Warm cream behind every screen. */
  background: '#FBF6EC',
  /** Cards, text fields and the dropdown. */
  surface: '#FFFDF9',
  /** Outlines of fields, cards and bars. */
  border: '#E7DAC4',
  /** Thin lines between list rows. */
  divider: '#EFE6D4',
  text: '#332A22',
  textSecondary: '#6B5D4F',
  /** Placeholders, captions and other quiet text. */
  textMuted: '#8A7A68',
  /** Buttons, links and highlights (the mockup's default accent). */
  accent: '#A34A1B',
  /** Text and icons drawn on the accent color. */
  onAccent: '#FFFDF9',
  /** Step numbers and the source card's link chip. */
  amber: '#8A5D0F',
  amberSoft: '#F3E6C6',
  /** The recipe banner and the icon drawn on it. */
  blue: '#2C5A7C',
  blueSoft: '#DCE9F1',
  /** The back button over the recipe banner (surface at 92% opacity). */
  surfaceTranslucent: 'rgba(255,253,249,0.92)',
  /** A pressed row, and the highlighted first row, in the suggestion dropdown. */
  pressed: '#F6EBD3',
} as const;

/** Spacing steps in px, from the mockup's paddings and gaps. */
export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 14,
  xl: 16,
  xxl: 20,
  xxxl: 24,
  /** Left and right padding on every screen. */
  screen: 20,
  /** Space above a screen's title. */
  screenTop: 22,
} as const;

export const radii = {
  sm: 10,
  md: 14,
  lg: 16,
  xl: 18,
  /** Fully rounded ends (pills, round buttons). */
  pill: 999,
} as const;

export const fontSize = {
  /** Pills and tab labels. */
  label: 11,
  caption: 12,
  meta: 13,
  body: 14,
  input: 15,
  emphasis: 16,
  cardTitle: 17,
  sectionTitle: 18,
  detailTitle: 25,
  screenTitle: 28,
  pantryTitle: 30,
} as const;

/**
 * The mockup's fonts, one family name per weight: Lora for headings, Nunito Sans for body text and
 * Caveat for the handwritten tagline. A custom font picks its weight by family, not by fontWeight,
 * so styles set fontFamily from here and leave fontWeight out. AppFontsGate loads these families.
 */
export const fonts = {
  heading: 'Lora_600SemiBold',
  regular: 'NunitoSans_400Regular',
  semibold: 'NunitoSans_600SemiBold',
  bold: 'NunitoSans_700Bold',
  heavy: 'NunitoSans_800ExtraBold',
  handwritten: 'Caveat_600SemiBold',
} as const;

export const shadows = {
  card: {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  dropdown: {
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 6,
  },
} as const;
