// PRESENTATION LAYER (root layout): wiring only. Device-only like src/main.ts, because it starts the real
// services (which open the SQLite database). Font loading lives in AppFontsGate; loading and error
// handling for the services live in RecipeServicesProvider.
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { startRecipeServices } from '../src/main';
import { AppFontsGate } from '../src/ui/AppFontsGate';
import { RecipeServicesProvider } from '../src/ui/RecipeServicesContext';
import { colors } from '../src/ui/theme';

export default function RootLayout() {
  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="dark" />
      <AppFontsGate>
        <RecipeServicesProvider start={startRecipeServices}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }} />
        </RecipeServicesProvider>
      </AppFontsGate>
    </SafeAreaView>
  );
}
