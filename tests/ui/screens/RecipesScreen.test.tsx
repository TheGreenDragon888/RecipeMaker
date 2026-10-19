import React from 'react';
import TestRenderer, { act, type ReactTestRenderer } from 'react-test-renderer';
import { ActivityIndicator, FlatList, StyleSheet } from 'react-native';
import type { RecipeServices } from '../../../src/createRecipeServices';
import type { RecipeSummary } from '../../../src/domain/recipe';
import { RecipeCard } from '../../../src/ui/components/RecipeCard';
import { RecipesScreen } from '../../../src/ui/screens/RecipesScreen';
import { dock } from '../../../src/ui/theme';
import { shownText } from '../../support/render';

function makeSummary(id: number, name: string): RecipeSummary {
  return { id, name, totalTimeMinutes: 30, activeTimeMinutes: 15, servingsMin: 4, servingsMax: 4 };
}

/** By default the service returns no recipes. */
async function setup({
  listAllRecipes = jest.fn().mockResolvedValue([]),
  bottomClearance,
}: { listAllRecipes?: jest.Mock; bottomClearance?: number } = {}) {
  const services = { listAllRecipes } as unknown as RecipeServices;
  const onOpenRecipe = jest.fn();
  let renderer!: ReactTestRenderer;
  await act(async () => {
    renderer = TestRenderer.create(
      <RecipesScreen services={services} onOpenRecipe={onOpenRecipe} bottomClearance={bottomClearance} />,
    );
  });
  return { renderer, listAllRecipes, onOpenRecipe };
}

const isLoading = (renderer: ReactTestRenderer) => renderer.root.findAllByType(ActivityIndicator).length > 0;
const cardNames = (renderer: ReactTestRenderer) =>
  renderer.root.findAllByType(RecipeCard).map((card) => card.props.recipe.name);
const never = () => new Promise<never>(() => {});

describe('RecipesScreen', () => {
  describe('loading', () => {
    it('asks for every recipe', async () => {
      const { listAllRecipes } = await setup();
      expect(listAllRecipes).toHaveBeenCalledTimes(1);
    });

    it('shows a loading indicator while recipes load', async () => {
      const { renderer } = await setup({ listAllRecipes: jest.fn().mockReturnValue(never()) });
      expect(isLoading(renderer)).toBe(true);
    });

    it('hides the loading indicator once recipes arrive', async () => {
      const { renderer } = await setup({ listAllRecipes: jest.fn().mockResolvedValue([makeSummary(1, 'Chili')]) });
      expect(isLoading(renderer)).toBe(false);
    });
  });

  describe('the list', () => {
    it('has the title "Recipes"', async () => {
      const { renderer } = await setup();
      expect(shownText(renderer)).toContain('Recipes');
    });

    it('lists the recipes in the order the service returns them', async () => {
      const { renderer } = await setup({
        listAllRecipes: jest.fn().mockResolvedValue([makeSummary(2, 'Apple Pie'), makeSummary(1, 'Chili')]),
      });
      expect(cardNames(renderer)).toEqual(['Apple Pie', 'Chili']);
    });

    it('shows no pantry match on the cards', async () => {
      const { renderer } = await setup({ listAllRecipes: jest.fn().mockResolvedValue([makeSummary(1, 'Chili')]) });
      expect(renderer.root.findByType(RecipeCard).props.onHand).toBeUndefined();
    });

    it('opens a recipe when its card is pressed', async () => {
      const { renderer, onOpenRecipe } = await setup({
        listAllRecipes: jest.fn().mockResolvedValue([makeSummary(1, 'Apple Pie'), makeSummary(2, 'Chili')]),
      });
      act(() => renderer.root.findAllByType(RecipeCard)[1].props.onPress());
      expect(onOpenRecipe).toHaveBeenCalledWith(2);
    });

    it('leaves room below the last card so the dock does not cover it', async () => {
      const { renderer } = await setup({ listAllRecipes: jest.fn().mockResolvedValue([makeSummary(1, 'Chili')]) });
      const content = StyleSheet.flatten(renderer.root.findByType(FlatList).props.contentContainerStyle);
      expect(content.paddingBottom).toBeGreaterThanOrEqual(dock.clearance);
    });

    it('leaves room for a dock lifted by a home indicator', async () => {
      const { renderer } = await setup({
        listAllRecipes: jest.fn().mockResolvedValue([makeSummary(1, 'Chili')]),
        bottomClearance: 110,
      });
      const content = StyleSheet.flatten(renderer.root.findByType(FlatList).props.contentContainerStyle);
      expect(content.paddingBottom).toBeGreaterThanOrEqual(110);
    });
  });

  describe('nothing to show', () => {
    it('shows a message when there are no recipes', async () => {
      const { renderer } = await setup({ listAllRecipes: jest.fn().mockResolvedValue([]) });
      expect(shownText(renderer)).toContain('No recipes yet.');
    });

    it('shows an error message when loading fails', async () => {
      const { renderer } = await setup({ listAllRecipes: jest.fn().mockRejectedValue(new Error('database busy')) });
      expect(shownText(renderer)).toContain("Couldn't load recipes.");
    });

    it('does not show the no-recipes message when loading fails', async () => {
      const { renderer } = await setup({ listAllRecipes: jest.fn().mockRejectedValue(new Error('database busy')) });
      expect(shownText(renderer)).not.toContain('No recipes yet.');
    });
  });
});
