// PRESENTATION LAYER: where the bottom dock sits on this phone, and how much room tab screens leave for it.
// The board's numbers assume no home indicator; on a phone with one, the dock moves up to sit just above it.
// While a sheet is open the dock moves down out of sight (dockHiddenDrop), so the sheet takes its place.
import { dock } from '../theme';

/** Distance from the bottom of the screen to the dock: the board's gap, or the bottom inset if that is larger. */
export function dockOffset(bottomInset: number): number {
  return Math.max(dock.bottom, bottomInset);
}

/** Room a tab screen leaves free at its bottom for the dock: the board's clearance, plus however far the dock moved up. */
export function dockClearance(bottomInset: number): number {
  return dock.clearance + dockOffset(bottomInset) - dock.bottom;
}

/** Extra drop past the dock's height, so its shadow (shadows.dock: 8 px down, 12 px blur) leaves the screen too. */
const SHADOW_ROOM = 24;

/** How far the dock, standing `dockBottom` from the screen's bottom (dockOffset), moves down to leave the screen. */
export function dockHiddenDrop(dockBottom: number): number {
  return dockBottom + dock.itemHeight + 2 * dock.padding + SHADOW_ROOM;
}

/** The dock's bottom and top edges, up from the screen's bottom edge. */
export function dockSpot(bottomInset: number): { bottom: number; top: number } {
  const bottom = dockOffset(bottomInset);
  return { bottom, top: bottom + dock.itemHeight + 2 * dock.padding };
}

/** A sheet must be this much clear of the dock's spot before the dock comes back, so it never flickers there. */
const ROOM_MARGIN = 8;

/**
 * Whether the dock can show beside a sheet whose edges are `sheetBottom` and `sheetTop` (up from the screen's
 * bottom edge, as it moves): when the sheet is above the dock's spot or has slid below it. `hadRoom` is the last
 * answer; coming back needs ROOM_MARGIN more room than staying does.
 */
export function dockHasRoom({
  sheetBottom,
  sheetTop,
  dock: spot,
  hadRoom,
}: {
  sheetBottom: number;
  sheetTop: number;
  dock: { bottom: number; top: number };
  hadRoom: boolean;
}): boolean {
  const margin = hadRoom ? 0 : ROOM_MARGIN;
  return sheetBottom >= spot.top + margin || sheetTop <= spot.bottom - margin;
}
