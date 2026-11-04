// PRESENTATION LAYER: how the bottom dock's pill moves between tabs, and how a finger sliding along the dock
// picks a tab. Every tab is dock.itemWidth wide, so only the dock's own place on screen needs measuring.
import { dock } from '../theme';

/** Where the pill behind the current tab sits for the tab at `index` (0 is the first tab). */
export function indicatorOffset(index: number): number {
  return index * dock.itemWidth;
}

/** A finger must slide this far sideways before a touch on the dock becomes a swipe, so taps still reach the tab. */
const SWIPE_START_PX = 6;
/** The finger can stray this far outside the dock and still pick the nearest tab; further out, the swipe cancels. */
const CANCEL_SLOP_PX = 40;

/** Whether a touch that has moved (dx, dy) is a swipe along the dock: mostly sideways and past a few pixels. */
export function startsDockSwipe(dx: number, dy: number): boolean {
  return Math.abs(dx) > SWIPE_START_PX && Math.abs(dx) > Math.abs(dy);
}

/**
 * The tab under a finger at (x, y), in px from the dock's top-left corner, for a dock of `count` tabs.
 * The padding and a little room outside the dock count as the nearest tab; null once the finger is well off it.
 */
export function dockSlotAt(x: number, y: number, count: number): number | null {
  const width = 2 * dock.padding + count * dock.itemWidth;
  const height = 2 * dock.padding + dock.itemHeight;
  const outside = x < -CANCEL_SLOP_PX || x > width + CANCEL_SLOP_PX || y < -CANCEL_SLOP_PX || y > height + CANCEL_SLOP_PX;
  if (outside || count === 0) return null;
  const slot = Math.floor((x - dock.padding) / dock.itemWidth);
  return Math.min(Math.max(slot, 0), count - 1);
}

/** The tab that letting go would open: the one under the finger, unless it is disabled or unknown. */
export function swipeTarget(slot: number | null, items: readonly ({ disabled: boolean } | undefined)[]): number | null {
  if (slot === null) return null;
  const item = items[slot];
  return item && !item.disabled ? slot : null;
}
