import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import type { RecipeServices } from './src/createRecipeServices';
import { startRecipeServices } from './src/main';
import { RecipeSearchScreen } from './src/ui/screens/RecipeSearchScreen';

export default function App() {
  const [services, setServices] = useState<RecipeServices | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;
    startRecipeServices().then((readyServices) => {
      if (active) setServices(readyServices);
    }).catch(() => {
      if (active) setError(true);
    });
    return () => { active = false; };
  }, []);

  return (
    <>
      <StatusBar style="auto" />
      {services ? <RecipeSearchScreen services={services} /> : (
        <View style={styles.loading}>
          {error ? <Text>Could not open the recipe database.</Text> : <ActivityIndicator accessibilityLabel="Loading recipes" />}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({ loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' } });
