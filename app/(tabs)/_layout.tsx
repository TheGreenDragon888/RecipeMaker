// PRESENTATION LAYER (layout for "/" and "/recipes"): the tab screens and the tab bar under them.
// iOS shows its own tab bar (NativeTabs), which brings the system's Liquid Glass, press-and-hold and swipe.
// Android shows the board's floating dock: the screens sit in a BlurTargetView, which the Android blur reads,
// and the dock must stay outside it. currentTabBar() picks one. Results and Recipe detail live outside this
// folder, so neither bar shows on them.
import React, { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { NativeTabs } from 'expo-router/native-tabs';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DockBar } from '../../src/ui/components/DockBar';
import { DockItem } from '../../src/ui/components/DockItem';
import { dockOffset } from '../../src/ui/platform/dockLayout';
import { currentDockSurface } from '../../src/ui/platform/dockSurface';
import { currentTabBar } from '../../src/ui/platform/tabBar';
import { colors, fonts } from '../../src/ui/theme';

export default function TabsLayout() {
  return currentTabBar() === 'native' ? <NativeTabsLayout /> : <DockTabsLayout />;
}

/** iOS: the system tab bar. Its icons are SF Symbols, filled in on the selected tab. */
function NativeTabsLayout() {
  return (
    <NativeTabs minimizeBehavior="onScrollDown" tintColor={colors.accent} labelStyle={{ fontFamily: fonts.semibold }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf={{ default: 'cabinet', selected: 'cabinet.fill' }} />
        <NativeTabs.Trigger.Label>Pantry</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="recipes">
        <NativeTabs.Trigger.Icon sf={{ default: 'book', selected: 'book.fill' }} />
        <NativeTabs.Trigger.Label>Recipes</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      {/* Bookmarks is left out until it's built: iOS can't draw a tab that looks disabled. */}
    </NativeTabs>
  );
}

/** Android (and anything else): the board's floating dock. */
function DockTabsLayout() {
  const screens = useRef<React.ComponentRef<typeof View>>(null);
  const insets = useSafeAreaInsets();
  return (
    <Tabs>
      <BlurTargetView ref={screens} style={styles.screens}>
        <TabSlot />
      </BlurTargetView>
      <TabList asChild>
        <DockBar surface={currentDockSurface()} bottom={dockOffset(insets.bottom)} blurTarget={screens}>
          <TabTrigger name="index" href="/" asChild>
            <DockItem label="Pantry" icon="pantry" />
          </TabTrigger>
          <TabTrigger name="recipes" href="/recipes" asChild>
            <DockItem label="Recipes" icon="recipes" />
          </TabTrigger>
          {/* Not built yet: shown so the dock matches the board, but it opens nothing. */}
          <DockItem label="Bookmarks" icon="bookmark" disabled accessibilityLabel="Bookmarks, coming soon" />
        </DockBar>
      </TabList>
    </Tabs>
  );
}

const styles = StyleSheet.create({
  screens: { flex: 1, backgroundColor: colors.background },
});
