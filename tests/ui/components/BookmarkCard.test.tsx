import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { RecipeSummary } from '../../../src/domain/recipe';
import type { RecipeReadiness } from '../../../src/domain/recipeReadiness';
import { BookmarkCard } from '../../../src/ui/components/BookmarkCard';
import { colors } from '../../../src/ui/theme';
import { recipeCards, shownText, styleOf } from '../../support/screen';

const recipe: RecipeSummary = { id: 7, name: 'Lemon Salmon', totalTimeMinutes: 30, activeTimeMinutes: 20, servingsMin: 2, servingsMax: 2 };
const almost: RecipeReadiness = {
  status: 'almost',
  onHandCount: 5,
  neededCount: 7,
  toBuy: [
    { ingredient: 'salmon', kind: 'missing' },
    { ingredient: 'dill', kind: 'missing' },
  ],
  swaps: [],
};

const show = (readiness: RecipeReadiness | null, onPress = jest.fn(), onRemove = jest.fn()) =>
  render(<BookmarkCard recipe={recipe} readiness={readiness} onPress={onPress} onRemove={onRemove} />);

describe('BookmarkCard', () => {
  it('shows the title and time', async () => {
    await show(null);
    expect(shownText()).toEqual(expect.arrayContaining(['Lemon Salmon', '30 min']));
  });

  it('shows the status pill', async () => {
    await show(almost);
    expect(shownText()).toContain('1-2 items needed');
  });

  it('shows the note', async () => {
    await show(almost);
    expect(shownText()).toContain('5/7 · need salmon, dill');
  });

  it("colors the pill for its status, as on the board", async () => {
    await show(almost);
    const pill = screen.getByText('1-2 items needed');
    expect([styleOf(pill).color, styleOf(pill).backgroundColor]).toEqual([colors.amber, colors.amberSoft]);
  });

  it('gives a recipe needing three or more items a neutral pill', async () => {
    await show({ ...almost, status: 'needsMore', toBuy: [...almost.toBuy, { ingredient: 'lemon', kind: 'missing' }] });
    expect(styleOf(screen.getByText('3 items needed')).color).toBe(colors.textSecondary);
  });

  it('shows only the title and time without readiness', async () => {
    await show(null);
    expect(shownText()).toEqual(['Lemon Salmon', '30 min']);
  });

  it('opens the recipe when tapped', async () => {
    const onPress = jest.fn();
    await show(almost, onPress);
    await fireEvent.press(recipeCards()[0]);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('removes the bookmark without opening the recipe', async () => {
    const onPress = jest.fn();
    const onRemove = jest.fn();
    await show(almost, onPress, onRemove);
    await fireEvent.press(screen.getByRole('button', { name: 'Remove Lemon Salmon from bookmarks' }));
    expect([onRemove.mock.calls.length, onPress.mock.calls.length]).toEqual([1, 0]);
  });
});
