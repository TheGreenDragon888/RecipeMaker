import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { RecipeSummary } from '../../../src/domain/recipe';
import { RecipeCard } from '../../../src/ui/components/RecipeCard';
import { fadedViews, fadesAsOnePicture, pressIn, shownIcons, shownText } from '../../support/screen';

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
  it('shows the recipe name', async () => {
    await render(<RecipeCard recipe={recipe} onHand={onHand} onPress={() => {}} />);
    expect(shownText()).toContain('Beef Tacos');
  });

  it('shows how many of the needed ingredients are on hand', async () => {
    await render(<RecipeCard recipe={recipe} onHand={onHand} onPress={() => {}} />);
    expect(shownText()).toContain('3/5 ingredients on hand');
  });

  it('leaves out the on-hand line when no counts are given', async () => {
    await render(<RecipeCard recipe={recipe} onPress={() => {}} />);
    expect(shownText().some((text) => text.endsWith('on hand'))).toBe(false);
  });

  it('shows the total time', async () => {
    await render(<RecipeCard recipe={recipe} onHand={onHand} onPress={() => {}} />);
    expect(shownText()).toContain('1 hr 15 min');
  });

  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    await render(<RecipeCard recipe={recipe} onHand={onHand} onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('fades as one picture while pressed', async () => {
    await render(<RecipeCard recipe={recipe} onHand={onHand} onPress={() => {}} />);
    await pressIn(screen.getByRole('button'));
    expect(fadedViews().map(fadesAsOnePicture)).toEqual([true]);
  });

  it('draws a clock icon beside the total time', async () => {
    await render(<RecipeCard recipe={recipe} onHand={onHand} onPress={() => {}} />);
    expect(shownIcons()).toEqual(['clock']);
  });
});
