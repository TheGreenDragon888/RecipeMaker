// PRESENTATION LAYER: starts the recipe services once and hands them to the screens below it.
// The root layout passes startRecipeServices (device-only); tests pass a fake start function.
import React, { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { RecipeServices } from '../createRecipeServices';
import { colors, fontSize, spacing } from './theme';

const RecipeServicesContext = createContext<RecipeServices | null>(null);

type Props = {
  start: () => Promise<RecipeServices>;
  children: React.ReactNode;
};

export function RecipeServicesProvider({ start, children }: Props) {
  const [services, setServices] = useState<RecipeServices | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    start().then(setServices, () => setFailed(true));
  }, []); // Start once, when the app opens.

  if (services) {
    return <RecipeServicesContext.Provider value={services}>{children}</RecipeServicesContext.Provider>;
  }
  return (
    <View style={styles.centered}>
      {failed ? (
        <Text style={styles.message}>Could not open the recipe database.</Text>
      ) : (
        <ActivityIndicator accessibilityLabel="Loading recipes" color={colors.accent} />
      )}
    </View>
  );
}

/** The started services. Only route wrappers in app/ call this; they pass the services to their screen. */
export function useRecipeServices(): RecipeServices {
  const services = useContext(RecipeServicesContext);
  if (!services) throw new Error('useRecipeServices must be used inside a RecipeServicesProvider');
  return services;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.screen,
    backgroundColor: colors.background,
  },
  message: { fontSize: fontSize.emphasis, color: colors.text, textAlign: 'center' },
});
