// PRESENTATION LAYER: how the bottom dock's pill moves between tabs, and how a finger sliding along the dock
// picks a tab. Every tab is dock.itemWidth wide, so only the dock's own place on screen needs measuring.
import { dock } from '../theme';

/** Where the pill behind the current tab sits for the tab at `index` (0 is the first tab). */
export function indicatorOffset(index: number): number {
  return index * dock.itemWidth;
}

/** A finger must slide this far sideways before a touch on the dock becomes a swipe, so taps still reach the tab. */
const SWIPE_START_PX = 6;
/** The finger can stray this far above or below the dock and still pick a tab; further out, the swipe cancels. */
const CANCEL_SLOP_PX = 40;

/** Whether a touch that has moved (dx, dy) is a swipe along the dock: mostly sideways and past a few pixels. */
export function startsDockSwipe(dx: number, dy: number): boolean {
  return Math.abs(dx) > SWIPE_START_PX && Math.abs(dx) > Math.abs(dy);
}

/**
 * The tab under a finger at (x, y), in px from the dock's top-left corner, for a dock of `count` tabs.
 * Past either end, however far, counts as the tab at that end. A little room above and below the dock counts
 * too; null once the finger is well above or below it.
 */
export function dockSlotAt(x: number, y: number, count: number): number | null {
  const height = 2 * dock.padding + dock.itemHeight;
  const outside = y < -CANCEL_SLOP_PX || y > height + CANCEL_SLOP_PX;
  if (outside || count === 0) return null;
  const slot = Math.floor((x - dock.padding) / dock.itemWidth);
  return Math.min(Math.max(slot, 0), count - 1);
}

/**
 * The tab that letting go would open: the one under the finger, or over a disabled tab the nearest enabled one
 * (the left one when two are as near). Nothing over a tab that hasn't reported itself yet.
 */
export function swipeTarget(slot: number | null, items: readonly ({ disabled: boolean } | undefined)[]): number | null {
  if (slot === null || !items[slot]) return null;
  const enabled = (index: number) => items[index]?.disabled === false;
  for (let distance = 0; distance < items.length; distance++) {
    if (enabled(slot - distance)) return slot - distance;
    if (enabled(slot + distance)) return slot + distance;
  }
  return null;
}
