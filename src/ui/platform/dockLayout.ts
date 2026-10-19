// PRESENTATION LAYER: where the bottom dock sits on this phone, and how much room screens leave for it.
// The board's numbers assume no home indicator; on a phone with one, the dock moves up to sit just above it.
import { dock } from '../theme';

/** Distance from the bottom of the screen to the dock: the board's gap, or the bottom inset if that is larger. */
export function dockOffset(bottomInset: number): number {
  return Math.max(dock.bottom, bottomInset);
}

/** Room a tab screen leaves free at its bottom for the dock: the board's clearance, plus however far the dock moved up. */
export function dockClearance(bottomInset: number): number {
  return dock.clearance + dockOffset(bottomInset) - dock.bottom;
}
