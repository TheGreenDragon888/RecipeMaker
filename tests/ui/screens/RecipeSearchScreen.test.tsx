import React from 'react';
import TestRenderer, { act } from 'react-test-renderer';
import { Text } from 'react-native';
import type { RecipeServices } from '../../../src/createRecipeServices';
import { RecipeSearchScreen } from '../../../src/ui/screens/RecipeSearchScreen';

describe('RecipeSearchScreen', () => {
  it('searches through the service and displays recipe names', async () => {
    const searchRecipesByIngredient = jest.fn().mockResolvedValue([
      { id: 1, name: 'Beef tacos', totalTimeMinutes: 30, activeTimeMinutes: 15, servingsMin: 4, servingsMax: 4 },
    ]);
    const services = { searchRecipesByIngredient } as unknown as RecipeServices;
    let renderer!: import('react-test-renderer').ReactTestRenderer;

    await act(async () => {
      renderer = TestRenderer.create(<RecipeSearchScreen services={services} />);
    });

    const input = renderer.root.findByProps({ accessibilityLabel: 'Ingredient to search' });
    await act(async () => input.props.onChangeText('beef'));
    const button = renderer.root.findByProps({ accessibilityRole: 'button' });
    await act(async () => button.props.onPress());

    expect(searchRecipesByIngredient).toHaveBeenCalledWith('beef');
    expect(renderer.root.findAllByType(Text).some((node) => node.props.children === 'Beef tacos')).toBe(true);
  }, 60000);
});
