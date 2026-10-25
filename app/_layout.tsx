// PRESENTATION LAYER (root layout): wiring only. Device-only like src/main.ts, because it starts the real
// services (which open the SQLite database). Font loading lives in AppFontsGate; loading and error
// handling for the services live in RecipeServicesProvider. The safe area pads the top only: the tab screens
// run to the bottom edge, under the tab bar (app/(tabs)/_layout.tsx: the dock on Android, the system bar on iOS), and every
// other screen gets the bottom inset as padding instead.
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { startRecipeServices } from '../src/main';
import { AppFontsGate } from '../src/ui/AppFontsGate';
import { RecipeServicesProvider } from '../src/ui/RecipeServicesContext';
import { colors } from '../src/ui/theme';

export default function RootLayout() {
  const insets = useSafeAreaInsets();
  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />
      <AppFontsGate>
        <RecipeServicesProvider start={startRecipeServices}>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.background, paddingBottom: insets.bottom },
            }}
          >
            <Stack.Screen name="(tabs)" options={{ contentStyle: { backgroundColor: colors.background } }} />
          </Stack>
        </RecipeServicesProvider>
      </AppFontsGate>
    </SafeAreaView>
  );
}
