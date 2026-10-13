// PRESENTATION LAYER: "My Pantry" — the user lists the ingredients they have, with autocomplete.
// Only ingredients in the database can be added: a tapped suggestion, or typed text that findIngredient
// recognizes. The Results screen runs the pantry search with the list from onFindRecipes.
import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { RecipeServices } from '../../createRecipeServices';
import { addPantryItem } from '../../domain/pantry';
import { Icon } from '../components/Icon';
import { PantryItemRow } from '../components/PantryItemRow';
import { PrimaryButton } from '../components/PrimaryButton';
import { SuggestionList } from '../components/SuggestionList';
import { formatMealTagline } from '../format/mealTagline';
import { formatFindRecipesLabel, formatUnknownIngredient } from '../format/pantryInfo';
import { colors, fonts, fontSize, radii, spacing } from '../theme';

type Props = {
  services: RecipeServices;
  onFindRecipes: (pantry: string[]) => void;
  /** The clock that picks the tagline; tests pass a fixed time. */
  now?: () => Date;
};

export function PantryScreen({ services, onFindRecipes, now = () => new Date() }: Props) {
  const [pantry, setPantry] = useState<string[]>([]);
  const [text, setText] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  /** A one-line message under the field (suggestions failed, unknown ingredient, ...), or null. */
  const [notice, setNotice] = useState<string | null>(null);
  const [focused, setFocused] = useState(false);
  // Numbers each request so a slow reply for older text can't act on newer text.
  const latestRequest = useRef(0);

  function changeText(value: string) {
    setText(value);
    setNotice(null);
    const request = ++latestRequest.current;
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }
    services.suggestIngredients(value).then(
      (found) => {
        if (request === latestRequest.current) setSuggestions(found);
      },
      () => {
        if (request !== latestRequest.current) return;
        setSuggestions([]);
        setNotice("Couldn't load suggestions");
      },
    );
  }

  function add(ingredient: string) {
    setPantry((current) => addPantryItem(current, ingredient));
    latestRequest.current += 1; // Replies still on their way are for text we're clearing.
    setText('');
    setSuggestions([]);
    setNotice(null);
  }

  /** Done key: add the ingredient the text names, else the first suggestion for it, else say it's unknown. */
  async function submit() {
    const typed = text;
    if (!typed.trim()) return;
    const request = ++latestRequest.current;
    const stillCurrent = () => request === latestRequest.current;
    try {
      const known = await services.findIngredient(typed);
      if (!stillCurrent()) return;
      if (known) return add(known);
      const suggested = await services.suggestIngredients(typed);
      if (!stillCurrent()) return;
      if (suggested.length > 0) return add(suggested[0]);
      setSuggestions([]);
      setNotice(formatUnknownIngredient(typed));
    } catch {
      if (stillCurrent()) setNotice("Couldn't check that ingredient");
    }
  }

  function remove(index: number) {
    setPantry((current) => current.filter((_, i) => i !== index));
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>My Pantry</Text>
        <Text style={styles.tagline} numberOfLines={1}>
          {formatMealTagline(now().getHours())}
        </Text>
      </View>

      <View style={styles.addArea}>
        <View style={[styles.field, focused && styles.fieldFocused]}>
          <Icon name="search" size={18} color={colors.textMuted} />
          <TextInput
            accessibilityLabel="Add an ingredient"
            autoCapitalize="none"
            autoCorrect={false}
            onBlur={() => setFocused(false)}
            onChangeText={changeText}
            onFocus={() => setFocused(true)}
            onSubmitEditing={submit}
            placeholder="Add an ingredient…"
            placeholderTextColor={colors.textMuted}
            returnKeyType="done"
            style={styles.input}
            submitBehavior="submit"
            value={text}
          />
        </View>

        {suggestions.length > 0 ? (
          <View style={styles.dropdown}>
            <SuggestionList suggestions={suggestions} typed={text} onSelect={add} />
          </View>
        ) : null}
        {notice ? (
          <View style={styles.dropdown}>
            <Text style={styles.notice}>{notice}</Text>
          </View>
        ) : null}
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} keyboardShouldPersistTaps="handled">
        {pantry.length === 0 ? (
          <Text style={styles.hint}>Add the ingredients you have.</Text>
        ) : (
          pantry.map((name, index) => <PantryItemRow key={name} name={name} onRemove={() => remove(index)} />)
        )}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton
          label={formatFindRecipesLabel(pantry.length)}
          onPress={() => onFindRecipes(pantry)}
          disabled={pantry.length === 0}
          showArrow
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingTop: spacing.screenTop,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xs,
  },
  title: { fontFamily: fonts.heading, fontSize: fontSize.pantryTitle, color: colors.text },
  tagline: { flexShrink: 1, fontFamily: fonts.handwritten, fontSize: 20, color: colors.accent },
  // Sits above the list so the dropdown can overlap it.
  addArea: { zIndex: 1, marginTop: spacing.lg, marginBottom: 6, marginHorizontal: spacing.screen },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  fieldFocused: { borderWidth: 1.5, borderColor: colors.accent },
  // paddingHorizontal 0: Android adds its own side padding to a TextInput; the field already has it.
  input: {
    flex: 1,
    fontFamily: fonts.regular,
    fontSize: fontSize.input,
    color: colors.text,
    paddingVertical: 10,
    paddingHorizontal: 0,
  },
  // Floats over the pantry list, the same width as the text field.
  dropdown: { position: 'absolute', top: '100%', left: 0, right: 0, marginTop: spacing.sm },
  notice: {
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    fontFamily: fonts.regular,
    fontSize: fontSize.caption,
    color: colors.textSecondary,
    overflow: 'hidden',
  },
  list: { flex: 1 },
  listContent: { paddingTop: 6, paddingHorizontal: spacing.screen, paddingBottom: spacing.xs },
  hint: { paddingVertical: spacing.lg, fontFamily: fonts.regular, fontSize: fontSize.body, color: colors.textSecondary },
  footer: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
});
