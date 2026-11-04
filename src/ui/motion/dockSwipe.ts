// PRESENTATION LAYER: how the bottom dock's pill moves between tabs, and how a finger sliding along the dock
// picks a tab. Positions are px from the first tab's left edge, inside the dock's padding. Every tab is
// dock.itemWidth wide, so nothing needs measuring.
import { dock } from '../theme';

/** Where the pill behind the current tab sits for the tab at `index` (0 is the first tab). */
export function indicatorOffset(index: number): number {
  return index * dock.itemWidth;
}
