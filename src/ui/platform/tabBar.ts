// PRESENTATION LAYER: picks which tab bar this device shows under the tab screens.

import { Platform } from 'react-native';

/**
 * - `native`: iOS's own tab bar (expo-router's NativeTabs), with the system's glass, press-and-hold and swipe.
 * - `dock`: the board's floating dock (DockBar), on Android and anything else.
 */
export type TabBarKind = 'native' | 'dock';

export function tabBarFor(os: string): TabBarKind {
  return os === 'ios' ? 'native' : 'dock';
}

/** The tab bar for the device the app is running on. */
export function currentTabBar(): TabBarKind {
  return tabBarFor(Platform.OS);
}
