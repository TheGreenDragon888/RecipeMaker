import React from 'react';
import TestRenderer, { act, type ReactTestRenderer } from 'react-test-renderer';
import { ActivityIndicator } from 'react-native';
import type { RecipeServices } from '../../../src/createRecipeServices';
import type { PantryMatch } from '../../../src/services/findRecipesFromPantry';
import { BackButton } from '../../../src/ui/components/BackButton';
import { RecipeCard } from '../../../src/ui/components/RecipeCard';
import { StateMessage } from '../../../src/ui/components/StateMessage';
import { ResultsScreen } from '../../../src/ui/screens/ResultsScreen';
import { shownText } from '../../support/render';

function makeMatch(id: number, name: string): PantryMatch {
  return {
    recipe: { id, name, totalTimeMinutes: 30, activeTimeMinutes: 15, servingsMin: 4, servingsMax: 4 },
    neededCount: 4,
    haveCount: 2,
    missingCount: 2,
  };
}

/** By default the pantry holds tomato and egg, and no recipes match. */
async function setup({
  pantry = ['tomato', 'egg'],
  findRecipesFromPantry = jest.fn().mockResolvedValue([]),
}: { pantry?: string[]; findRecipesFromPantry?: jest.Mock } = {}) {
  const services = { findRecipesFromPantry } as unknown as RecipeServices;
  const onOpenRecipe = jest.fn();
  const onBack = jest.fn();
  const screen = (items: string[]) => (
    <ResultsScreen services={services} pantry={items} onOpenRecipe={onOpenRecipe} onBack={onBack} />
  );
  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(screen(pantry));
  });
  /** Re-renders the screen with a different pantry list. */
  const showPantry = async (items: string[]) => act(async () => renderer.update(screen(items)));
  return { renderer, findRecipesFromPantry, onOpenRecipe, onBack, showPantry };
}

/** A promise the test resolves or rejects later, to control when a service reply arrives. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

const isLoading = (renderer: ReactTestRenderer) => renderer.root.findAllByType(ActivityIndicator).length > 0;
const cardNames = (renderer: ReactTestRenderer) =>
  renderer.root.findAllByType(RecipeCard).map((card) => card.props.recipe.name);

describe('ResultsScreen', () => {
  describe('searching', () => {
    it('searches with the pantry list', async () => {
      const { findRecipesFromPantry } = await setup({ pantry: ['tomato', 'egg'] });
      expect(findRecipesFromPantry).toHaveBeenCalledWith(['tomato', 'egg']);
    });

    it('shows a loading indicator while recipes load', async () => {
      const { renderer } = await setup({ findRecipesFromPantry: jest.fn().mockReturnValue(deferred().promise) });
      expect(isLoading(renderer)).toBe(true);
    });

    it('hides the loading indicator once recipes arrive', async () => {
      const { renderer } = await setup({ findRecipesFromPantry: jest.fn().mockResolvedValue([makeMatch(1, 'Shakshuka')]) });
      expect(isLoading(renderer)).toBe(false);
    });

    it('ignores results for an earlier pantry list', async () => {
      const forEgg = deferred<PantryMatch[]>();
      const forTomato = deferred<PantryMatch[]>();
      const findRecipesFromPantry = jest.fn().mockReturnValueOnce(forEgg.promise).mockReturnValueOnce(forTomato.promise);
      const { renderer, showPantry } = await setup({ pantry: ['egg'], findRecipesFromPantry });
      await showPantry(['tomato']);

      await act(async () => forTomato.resolve([makeMatch(2, 'Tomato Soup')]));
      await act(async () => forEgg.resolve([makeMatch(1, 'Omelet')]));

      expect(cardNames(renderer)).toEqual(['Tomato Soup']);
    });
  });

  describe('results', () => {
    it('shows the name of each recipe found', async () => {
      const { renderer } = await setup({
        findRecipesFromPantry: jest.fn().mockResolvedValue([makeMatch(1, 'Shakshuka'), makeMatch(2, 'Egg Fried Rice')]),
      });
      expect(shownText(renderer)).toEqual(expect.arrayContaining(['Shakshuka', 'Egg Fried Rice']));
    });

    it('lists the recipes in the order the service returns them', async () => {
      const { renderer } = await setup({
        findRecipesFromPantry: jest.fn().mockResolvedValue([makeMatch(2, 'Egg Fried Rice'), makeMatch(1, 'Shakshuka')]),
      });
      expect(cardNames(renderer)).toEqual(['Egg Fried Rice', 'Shakshuka']);
    });

    it('shows how many pantry ingredients it matched against', async () => {
      const { renderer } = await setup({ pantry: ['tomato', 'egg'] });
      expect(shownText(renderer)).toContain('Matched against your 2 pantry ingredients');
    });

    it('leaves out the matched-against line when the pantry list is empty', async () => {
      const { renderer } = await setup({ pantry: [] });
      expect(shownText(renderer).some((text) => text.startsWith('Matched against'))).toBe(false);
    });

    it('opens a recipe when its card is pressed', async () => {
      const { renderer, onOpenRecipe } = await setup({
        findRecipesFromPantry: jest.fn().mockResolvedValue([makeMatch(1, 'Shakshuka'), makeMatch(2, 'Egg Fried Rice')]),
      });
      act(() => renderer.root.findAllByType(RecipeCard)[1].props.onPress());
      expect(onOpenRecipe).toHaveBeenCalledWith(2);
    });

    it('goes back to the pantry when the back button is pressed', async () => {
      const { renderer, onBack } = await setup();
      act(() => renderer.root.findByType(BackButton).props.onPress());
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('labels the back button for screen readers', async () => {
      const { renderer } = await setup();
      expect(renderer.root.findByType(BackButton).props.label).toBe('Back to pantry');
    });
  });

  describe('no results', () => {
    it('shows a message when no recipes match', async () => {
      const { renderer } = await setup({ findRecipesFromPantry: jest.fn().mockResolvedValue([]) });
      expect(shownText(renderer)).toContain('No recipes match your pantry.');
    });

    it('offers a way back to the pantry when no recipes match', async () => {
      const { renderer, onBack } = await setup({ findRecipesFromPantry: jest.fn().mockResolvedValue([]) });
      act(() => renderer.root.findByType(StateMessage).findByProps({ accessibilityLabel: 'Back to pantry' }).props.onPress());
      expect(onBack).toHaveBeenCalledTimes(1);
    });

    it('shows an error message when the search fails', async () => {
      const { renderer } = await setup({ findRecipesFromPantry: jest.fn().mockRejectedValue(new Error('database busy')) });
      expect(shownText(renderer)).toContain("Couldn't load recipes.");
    });

    it('does not show the no-match message when the search fails', async () => {
      const { renderer } = await setup({ findRecipesFromPantry: jest.fn().mockRejectedValue(new Error('database busy')) });
      expect(shownText(renderer)).not.toContain('No recipes match your pantry.');
    });
  });
});
