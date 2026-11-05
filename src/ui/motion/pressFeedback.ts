// PRESENTATION LAYER: how far a control shrinks while a finger is on it, so a press is felt before it lands.
// Smaller things shrink more, so each moves about the same few pixels.

/** How big a pressable thing is: a full-width card, a button, or a small control (a chip, a round button). */
export type PressSize = 'card' | 'button' | 'small';

const PRESSED_SCALE: Record<PressSize, number> = { card: 0.97, button: 0.95, small: 0.9 };

/** The scale a control shrinks to while pressed; 1 (no shrinking) with Reduce Motion on. */
export function pressedScale(size: PressSize, reduceMotion: boolean): number {
  return reduceMotion ? 1 : PRESSED_SCALE[size];
}
