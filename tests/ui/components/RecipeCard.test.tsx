import React from 'react';
import { act } from 'react-test-renderer';
import type { RecipeSummary } from '../../../src/domain/recipe';
import { RecipeCard } from '../../../src/ui/components/RecipeCard';
import { render, shownText } from '../../support/render';

const recipe: RecipeSummary = {
  id: 7,
  name: 'Beef Tacos',
  totalTimeMinutes: 75,
  activeTimeMinutes: 20,
  servingsMin: 4,
  servingsMax: 4,
};
const onHand = { haveCount: 3, neededCount: 5 };

describe('RecipeCard', () => {
  it('shows the recipe name', () => {
    const renderer = render(<RecipeCard recipe={recipe} onHand={onHand} onPress={() => {}} />);
    expect(shownText(renderer)).toContain('Beef Tacos');
  });

  it('shows how many of the needed ingredients are on hand', () => {
    const renderer = render(<RecipeCard recipe={recipe} onHand={onHand} onPress={() => {}} />);
    expect(shownText(renderer)).toContain('3/5 ingredients on hand');
  });

  it('leaves out the on-hand line when no counts are given', () => {
    const renderer = render(<RecipeCard recipe={recipe} onPress={() => {}} />);
    expect(shownText(renderer).some((text) => text.endsWith('on hand'))).toBe(false);
  });

  it('shows the total time', () => {
    const renderer = render(<RecipeCard recipe={recipe} onHand={onHand} onPress={() => {}} />);
    expect(shownText(renderer)).toContain('1 hr 15 min');
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const renderer = render(<RecipeCard recipe={recipe} onHand={onHand} onPress={onPress} />);
    act(() => renderer.root.findByProps({ accessibilityRole: 'button' }).props.onPress());
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
