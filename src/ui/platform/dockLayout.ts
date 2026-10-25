// PRESENTATION LAYER: where the bottom dock sits on this phone, and how much room tab screens leave for the tab bar.
// The board's numbers assume no home indicator; on a phone with one, the dock moves up to sit just above it.
// On iOS the system's tab bar replaces the dock (see platform/tabBar).
import { dock } from '../theme';
import type { TabBarKind } from './tabBar';

/** Distance from the bottom of the screen to the dock: the board's gap, or the bottom inset if that is larger. */
export function dockOffset(bottomInset: number): number {
  return Math.max(dock.bottom, bottomInset);
}

/** Room a tab screen leaves free at its bottom for the dock: the board's clearance, plus however far the dock moved up. */
export function dockClearance(bottomInset: number): number {
  return dock.clearance + dockOffset(bottomInset) - dock.bottom;
}

/**
 * Room a tab screen leaves free at its bottom for whichever tab bar this device shows. Inside an iOS tab the
 * safe area's bottom inset already includes the system bar (49 pt bar + 34 pt home indicator = 83 on a 390×844
 * iPhone, measured in Expo Go), so the room is that inset plus the board's gap between the dock and the screen's
 * bottom, which keeps "Find recipes" from sitting right on the bar.
 */
export function tabScreenClearance({ tabBar, bottomInset }: { tabBar: TabBarKind; bottomInset: number }): number {
  return tabBar === 'native' ? bottomInset + dock.bottom : dockClearance(bottomInset);
}
