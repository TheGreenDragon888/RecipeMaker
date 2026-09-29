import React, { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { RecipeServices } from '../../createRecipeServices';
import type { RecipeSummary } from '../../domain/recipe';

type Props = { services: RecipeServices };

export function RecipeSearchScreen({ services }: Props) {
  const [term, setTerm] = useState('');
  const [recipes, setRecipes] = useState<RecipeSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  async function search() {
    setLoading(true);
    setError(null);
    setHasSearched(true);
    try {
      setRecipes(await services.searchRecipesByIngredient(term));
    } catch {
      setRecipes([]);
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Find a recipe</Text>
      <Text style={styles.prompt}>Search by an ingredient you have.</Text>
      <TextInput
        accessibilityLabel="Ingredient to search"
        onChangeText={setTerm}
        onSubmitEditing={search}
        placeholder="Try beef"
        returnKeyType="search"
        style={styles.input}
        value={term}
      />
      <Pressable accessibilityRole="button" onPress={search} style={styles.button}>
        <Text style={styles.buttonText}>Search</Text>
      </Pressable>
      {loading ? <ActivityIndicator accessibilityLabel="Searching" style={styles.message} /> : null}
      {error ? <Text accessibilityRole="alert" style={styles.message}>{error}</Text> : null}
      {!loading && !error && hasSearched && recipes.length === 0 ? (
        <Text style={styles.message}>No recipes found.</Text>
      ) : null}
      <ScrollView style={styles.results}>
        {recipes.map((recipe) => <Text key={recipe.id} style={styles.recipe}>{recipe.name}</Text>)}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 64, backgroundColor: '#fff' },
  title: { fontSize: 28, fontWeight: '700', color: '#173b2b' },
  prompt: { marginTop: 8, marginBottom: 20, fontSize: 16, color: '#475569' },
  input: { borderWidth: 1, borderColor: '#94a3b8', borderRadius: 8, padding: 12, fontSize: 16 },
  button: { marginTop: 12, padding: 14, alignItems: 'center', borderRadius: 8, backgroundColor: '#236b45' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  message: { marginTop: 20, color: '#334155' },
  results: { marginTop: 16 },
  recipe: { paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#cbd5e1', fontSize: 17 },
});
