// PRESENTATION LAYER (layout for "/" and "/recipes"): the tab screens and the board's floating dock under them,
// on iOS and Android alike. The screens sit in a BlurTargetView, which the Android blur reads (elsewhere it is a
// plain view), and the dock must stay outside it. Results and Recipe detail live outside this folder, so the dock
// doesn't show on them. While a tab's screen shows a sheet (it says so through DockVisibilityProvider), the dock
// moves off the bottom of the screen, so the sheet can reach the bottom edge.
import React, { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurTargetView } from 'expo-blur';
import { TabList, TabSlot, TabTrigger, Tabs } from 'expo-router/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DockBar } from '../../src/ui/components/DockBar';
import { DockItem } from '../../src/ui/components/DockItem';
import { DockVisibilityProvider } from '../../src/ui/DockVisibilityContext';
import { dockOffset } from '../../src/ui/platform/dockLayout';
import { currentDockSurface } from '../../src/ui/platform/dockSurface';
import { colors } from '../../src/ui/theme';

export default function TabsLayout() {
  const screens = useRef<React.ComponentRef<typeof View>>(null);
  const insets = useSafeAreaInsets();
  const [sheetShown, setSheetShown] = useState(false);
  return (
    <Tabs>
      <BlurTargetView ref={screens} style={styles.screens}>
        <DockVisibilityProvider onSheetShownChange={setSheetShown}>
          <TabSlot />
        </DockVisibilityProvider>
      </BlurTargetView>
      <TabList asChild>
        <DockBar surface={currentDockSurface()} bottom={dockOffset(insets.bottom)} blurTarget={screens} hidden={sheetShown}>
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
