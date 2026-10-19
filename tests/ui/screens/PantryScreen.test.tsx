import React from 'react';
import TestRenderer, { act, type ReactTestRenderer } from 'react-test-renderer';
import { ScrollView, StyleSheet } from 'react-native';
import type { RecipeServices } from '../../../src/createRecipeServices';
import { Icon } from '../../../src/ui/components/Icon';
import { PantryItemRow } from '../../../src/ui/components/PantryItemRow';
import { PrimaryButton } from '../../../src/ui/components/PrimaryButton';
import { SuggestionList } from '../../../src/ui/components/SuggestionList';
import { PantryScreen } from '../../../src/ui/screens/PantryScreen';
import { dock } from '../../../src/ui/theme';
import { render, shownText } from '../../support/render';

const sixPm = () => new Date(2026, 9, 10, 18, 0);

/** By default every typed word counts as a known ingredient (lowercased), and nothing is suggested. */
function setup({
  suggestIngredients = jest.fn().mockResolvedValue([]),
  findIngredient = jest.fn(async (raw: string) => raw.trim().toLowerCase() || null),
}: { suggestIngredients?: jest.Mock; findIngredient?: jest.Mock } = {}) {
  const services = { suggestIngredients, findIngredient } as unknown as RecipeServices;
  const onFindRecipes = jest.fn();
  let renderer!: ReactTestRenderer;
  act(() => {
    renderer = TestRenderer.create(<PantryScreen services={services} onFindRecipes={onFindRecipes} now={sixPm} />);
  });
  return { renderer, suggestIngredients, findIngredient, onFindRecipes };
}

/** A promise the test resolves or rejects later, to control when a service reply arrives. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

const byLabel = (renderer: ReactTestRenderer, label: string) => renderer.root.findByProps({ accessibilityLabel: label });
const field = (renderer: ReactTestRenderer) => byLabel(renderer, 'Add an ingredient');

async function typeText(renderer: ReactTestRenderer, text: string) {
  await act(async () => field(renderer).props.onChangeText(text));
}

/** Presses Done without waiting on the lookup itself, so a test can keep that lookup pending. */
async function pressDone(renderer: ReactTestRenderer) {
  await act(async () => {
    field(renderer).props.onSubmitEditing();
  });
}

async function press(renderer: ReactTestRenderer, label: string) {
  await act(async () => byLabel(renderer, label).props.onPress());
}

async function addIngredient(renderer: ReactTestRenderer, text: string) {
  await typeText(renderer, text);
  await pressDone(renderer);
}

const pantryNames = (renderer: ReactTestRenderer) =>
  renderer.root.findAllByType(PantryItemRow).map((row) => row.props.name);

const pantryQuantities = (renderer: ReactTestRenderer) =>
  renderer.root.findAllByType(PantryItemRow).map((row) => row.props.quantity);

const suggestionLists = (renderer: ReactTestRenderer) => renderer.root.findAllByType(SuggestionList);

describe('PantryScreen', () => {
  describe('pantry list', () => {
    it('shows the tagline for the time of day', () => {
      const { renderer } = setup();
      expect(shownText(renderer)).toContain("what's for dinner?");
    });

    it('draws a search icon in the text field', () => {
      const { renderer } = setup();
      expect(renderer.root.findAllByType(Icon).map((icon) => icon.props.name)).toContain('search');
    });

    it('shows a hint when the pantry is empty', () => {
      const { renderer } = setup();
      expect(shownText(renderer)).toContain('Add the ingredients you have.');
    });

    it('hides the hint once an ingredient is added', async () => {
      const { renderer } = setup();
      await addIngredient(renderer, 'tomato');
      expect(shownText(renderer)).not.toContain('Add the ingredients you have.');
    });

    it('disables the find button while the pantry is empty', () => {
      const { renderer } = setup();
      expect(byLabel(renderer, 'Find recipes with 0 ingredients').props.accessibilityState).toEqual({ disabled: true });
    });

    it('does not show a separate add button', () => {
      const { renderer } = setup();
      expect(() => byLabel(renderer, 'Add ingredient')).toThrow();
    });

    it('clears the text field after adding an ingredient', async () => {
      const { renderer } = setup();
      await addIngredient(renderer, 'tomato');
      expect(field(renderer).props.value).toBe('');
    });

    it('does not add an ingredient that is already in the pantry', async () => {
      const { renderer } = setup();
      await addIngredient(renderer, 'tomato');
      await addIngredient(renderer, 'Tomato ');
      expect(pantryNames(renderer)).toEqual(['tomato']);
    });

    it('removes an ingredient when its remove button is pressed', async () => {
      const { renderer } = setup();
      await addIngredient(renderer, 'tomato');
      await addIngredient(renderer, 'egg');
      await press(renderer, 'Remove tomato');
      expect(pantryNames(renderer)).toEqual(['egg']);
    });

    it('shows the number of ingredients on the find button', async () => {
      const { renderer } = setup();
      await addIngredient(renderer, 'tomato');
      await addIngredient(renderer, 'egg');
      expect(byLabel(renderer, 'Find recipes with 2 ingredients')).toBeTruthy();
    });

    it('passes the pantry list to onFindRecipes when the find button is pressed', async () => {
      const { renderer, onFindRecipes } = setup();
      await addIngredient(renderer, 'tomato');
      await addIngredient(renderer, 'egg');
      await press(renderer, 'Find recipes with 2 ingredients');
      expect(onFindRecipes).toHaveBeenCalledWith(['tomato', 'egg']);
    });
  });

  describe('room for the dock', () => {
    it('floats the find button just above the dock, as on the board', () => {
      const { renderer } = setup();
      const holder = renderer.root.findByType(PrimaryButton).parent!;
      expect(StyleSheet.flatten(holder.props.style)).toMatchObject({ position: 'absolute', bottom: dock.clearance });
    });

    it('leaves room below the last ingredient for the find button and the dock', () => {
      const { renderer } = setup();
      const content = StyleSheet.flatten(renderer.root.findByType(ScrollView).props.contentContainerStyle);
      expect(content.paddingBottom).toBeGreaterThan(dock.clearance);
    });

    it('floats the find button above a dock lifted by a home indicator', () => {
      const renderer = render(
        <PantryScreen services={{} as RecipeServices} onFindRecipes={() => {}} now={sixPm} bottomClearance={110} />,
      );
      const holder = renderer.root.findByType(PrimaryButton).parent!;
      expect(StyleSheet.flatten(holder.props.style).bottom).toBe(110);
    });

    it('leaves room below the last ingredient for a dock lifted by a home indicator', () => {
      const renderer = render(
        <PantryScreen services={{} as RecipeServices} onFindRecipes={() => {}} now={sixPm} bottomClearance={110} />,
      );
      const content = StyleSheet.flatten(renderer.root.findByType(ScrollView).props.contentContainerStyle);
      expect(content.paddingBottom).toBeGreaterThan(110);
    });
  });

  describe('quantities', () => {
    it('starts a new ingredient at 1', async () => {
      const { renderer } = setup();
      await addIngredient(renderer, 'tomato');
      expect(pantryQuantities(renderer)).toEqual([1]);
    });

    it('raises the quantity when + is pressed', async () => {
      const { renderer } = setup();
      await addIngredient(renderer, 'tomato');
      await press(renderer, 'Increase tomato quantity');
      expect(pantryQuantities(renderer)).toEqual([2]);
    });

    it('lowers the quantity when − is pressed', async () => {
      const { renderer } = setup();
      await addIngredient(renderer, 'tomato');
      await press(renderer, 'Increase tomato quantity');
      await press(renderer, 'Decrease tomato quantity');
      expect(pantryQuantities(renderer)).toEqual([1]);
    });

    it('leaves the other ingredients alone when − is pressed twice quickly on a quantity of 1', async () => {
      const { renderer } = setup();
      await addIngredient(renderer, 'tomato');
      await addIngredient(renderer, 'egg');
      const removeTomato = byLabel(renderer, 'Remove tomato').props.onPress;
      await act(async () => {
        removeTomato();
        removeTomato();
      });
      expect(pantryNames(renderer)).toEqual(['egg']);
    });

    it('tells the row it can no longer increase at 99', async () => {
      const { renderer } = setup();
      await addIngredient(renderer, 'tomato');
      for (let i = 1; i < 99; i++) await press(renderer, 'Increase tomato quantity');
      expect(renderer.root.findByType(PantryItemRow).props.canIncrease).toBe(false);
    });

    it('counts ingredients, not quantities, on the find button', async () => {
      const { renderer } = setup();
      await addIngredient(renderer, 'tomato');
      await addIngredient(renderer, 'egg');
      await press(renderer, 'Increase tomato quantity');
      expect(byLabel(renderer, 'Find recipes with 2 ingredients')).toBeTruthy();
    });

    it('passes only the ingredient names to onFindRecipes', async () => {
      const { renderer, onFindRecipes } = setup();
      await addIngredient(renderer, 'tomato');
      await addIngredient(renderer, 'egg');
      await press(renderer, 'Increase tomato quantity');
      await press(renderer, 'Find recipes with 2 ingredients');
      expect(onFindRecipes).toHaveBeenCalledWith(['tomato', 'egg']);
    });
  });

  describe('adding with the Done key', () => {
    it('adds a known ingredient', async () => {
      const { renderer } = setup();
      await addIngredient(renderer, 'egg');
      expect(pantryNames(renderer)).toEqual(['egg']);
    });

    it('looks up the typed text with findIngredient', async () => {
      const { renderer, findIngredient } = setup();
      await addIngredient(renderer, 'scallions');
      expect(findIngredient).toHaveBeenCalledWith('scallions');
    });

    it('adds the database name for an alias', async () => {
      const findIngredient = jest.fn().mockResolvedValue('green onion');
      const { renderer } = setup({ findIngredient });
      await addIngredient(renderer, 'scallions');
      expect(pantryNames(renderer)).toEqual(['green onion']);
    });

    it('adds the first suggestion when the text is only part of a name', async () => {
      const { renderer } = setup({
        findIngredient: jest.fn().mockResolvedValue(null),
        suggestIngredients: jest.fn().mockResolvedValue(['tomato', 'tomato paste']),
      });
      await addIngredient(renderer, 'tom');
      expect(pantryNames(renderer)).toEqual(['tomato']);
    });

    it('does not add text that is not a known ingredient', async () => {
      const { renderer } = setup({ findIngredient: jest.fn().mockResolvedValue(null) });
      await addIngredient(renderer, 'dragonfruit');
      expect(pantryNames(renderer)).toEqual([]);
    });

    it('says when the text is not a known ingredient', async () => {
      const { renderer } = setup({ findIngredient: jest.fn().mockResolvedValue(null) });
      await addIngredient(renderer, 'dragonfruit');
      expect(shownText(renderer)).toContain('“dragonfruit” isn’t in our ingredient list.');
    });

    it('keeps unknown text in the field so it can be corrected', async () => {
      const { renderer } = setup({ findIngredient: jest.fn().mockResolvedValue(null) });
      await addIngredient(renderer, 'dragonfruit');
      expect(field(renderer).props.value).toBe('dragonfruit');
    });

    it('hides the not-found message once the user types again', async () => {
      const { renderer } = setup({ findIngredient: jest.fn().mockResolvedValue(null) });
      await addIngredient(renderer, 'dragonfruit');
      await typeText(renderer, 'dragon');
      expect(shownText(renderer)).not.toContain('“dragonfruit” isn’t in our ingredient list.');
    });

    it('does nothing when the text is blank', async () => {
      const { renderer, findIngredient } = setup();
      await addIngredient(renderer, '   ');
      expect(findIngredient).not.toHaveBeenCalled();
    });

    it('says when the ingredient check fails', async () => {
      const { renderer } = setup({ findIngredient: jest.fn().mockRejectedValue(new Error('database busy')) });
      await addIngredient(renderer, 'tomato');
      expect(shownText(renderer)).toContain("Couldn't check that ingredient");
    });

    it('ignores a lookup that finishes after the user typed something else', async () => {
      const lookup = deferred<string | null>();
      const { renderer } = setup({ findIngredient: jest.fn().mockReturnValue(lookup.promise) });
      await addIngredient(renderer, 'tomato');
      await typeText(renderer, 'egg');
      await act(async () => lookup.resolve('tomato'));
      expect(pantryNames(renderer)).toEqual([]);
    });
  });

  describe('suggestions', () => {
    it('asks for suggestions with the typed text', async () => {
      const { renderer, suggestIngredients } = setup();
      await typeText(renderer, 'to');
      expect(suggestIngredients).toHaveBeenCalledWith('to');
    });

    it('does not ask for suggestions when the text is blank', async () => {
      const { renderer, suggestIngredients } = setup();
      await typeText(renderer, '  ');
      expect(suggestIngredients).not.toHaveBeenCalled();
    });

    it('shows the suggestions for the typed text', async () => {
      const { renderer } = setup({ suggestIngredients: jest.fn().mockResolvedValue(['tofu', 'tomato']) });
      await typeText(renderer, 'to');
      expect(suggestionLists(renderer)[0].props.suggestions).toEqual(['tofu', 'tomato']);
    });

    it('does not show the suggestion list when nothing matches', async () => {
      const { renderer } = setup();
      await typeText(renderer, 'zz');
      expect(suggestionLists(renderer)).toHaveLength(0);
    });

    it('adds a suggestion when it is tapped', async () => {
      const { renderer } = setup({ suggestIngredients: jest.fn().mockResolvedValue(['tofu', 'tomato']) });
      await typeText(renderer, 'to');
      await press(renderer, 'Add tomato');
      expect(pantryNames(renderer)).toEqual(['tomato']);
    });

    it('hides the suggestions after one is tapped', async () => {
      const { renderer } = setup({ suggestIngredients: jest.fn().mockResolvedValue(['tofu', 'tomato']) });
      await typeText(renderer, 'to');
      await press(renderer, 'Add tomato');
      expect(suggestionLists(renderer)).toHaveLength(0);
    });

    it('hides the suggestions when the text is cleared', async () => {
      const { renderer } = setup({ suggestIngredients: jest.fn().mockResolvedValue(['tofu']) });
      await typeText(renderer, 'to');
      await typeText(renderer, '');
      expect(suggestionLists(renderer)).toHaveLength(0);
    });

    it('shows a message when suggestions fail to load', async () => {
      const { renderer } = setup({ suggestIngredients: jest.fn().mockRejectedValue(new Error('database busy')) });
      await typeText(renderer, 'to');
      expect(shownText(renderer)).toContain("Couldn't load suggestions");
    });

    it('hides the failure message once the user types again', async () => {
      const suggestIngredients = jest.fn().mockRejectedValueOnce(new Error('database busy')).mockResolvedValue(['tomato']);
      const { renderer } = setup({ suggestIngredients });
      await typeText(renderer, 'to');
      await typeText(renderer, 'tom');
      expect(shownText(renderer)).not.toContain("Couldn't load suggestions");
    });

    it('ignores suggestions that arrive after newer text was typed', async () => {
      const forTo = deferred<string[]>();
      const forTom = deferred<string[]>();
      const suggestIngredients = jest.fn().mockReturnValueOnce(forTo.promise).mockReturnValueOnce(forTom.promise);
      const { renderer } = setup({ suggestIngredients });
      await typeText(renderer, 'to');
      await typeText(renderer, 'tom');

      await act(async () => forTom.resolve(['tomato']));
      await act(async () => forTo.resolve(['tofu', 'tomato']));

      expect(suggestionLists(renderer)[0].props.suggestions).toEqual(['tomato']);
    });
  });
});
