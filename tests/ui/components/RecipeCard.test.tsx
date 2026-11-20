import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import type { RecipeSummary } from '../../../src/domain/recipe';
import type { RecipeReadiness } from '../../../src/domain/recipeReadiness';
import { RecipeCard } from '../../../src/ui/components/RecipeCard';
import { colors } from '../../../src/ui/theme';
import {
  fadedViews,
  fadesAsOnePicture,
  iconDrawing,
  pressIn,
  recipeCards,
  shownIcons,
  shownText,
  scaleWhilePressed,
  styleOf,
} from '../../support/screen';
import { pressedScale } from '../../../src/ui/motion/pressFeedback';

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
    expect(shownIcons()).toEqual(['utensils', 'clock']);
  });
});

describe('RecipeCard readiness', () => {
  const almost: RecipeReadiness = {
    status: 'almost',
    onHandCount: 3,
    neededCount: 5,
    toBuy: [
      { ingredient: 'beef', kind: 'missing' },
      { ingredient: 'salsa', kind: 'missing' },
    ],
    swaps: [],
  };
  const show = (readiness: RecipeReadiness | null, shownOnHand?: typeof onHand) =>
    render(<RecipeCard recipe={recipe} readiness={readiness} onHand={shownOnHand} onPress={() => {}} />);
  /** The 76 px square around the card's icon. */
  const tile = () => {
    let node = iconDrawing('utensils');
    while (styleOf(node).width !== 76) node = node.parent!;
    return node;
  };

  it('shows the status pill', async () => {
    await show(almost);
    expect(shownText()).toContain('1-2 items needed');
  });

  it('shows what is still needed', async () => {
    await show(almost);
    expect(shownText()).toContain('3/5 · need beef, salsa');
  });

  it('shows the note in place of the on-hand count', async () => {
    await show(almost, onHand);
    expect(shownText()).not.toContain('3/5 ingredients on hand');
  });

  it('keeps the on-hand count while there is no readiness', async () => {
    await show(null, onHand);
    expect(shownText()).toContain('3/5 ingredients on hand');
  });

  it('shows only the title and time with no readiness or count', async () => {
    await show(null);
    expect(shownText()).toEqual(['Beef Tacos', '1 hr 15 min']);
  });

  it.each([
    ['ready', 'Ready to cook', colors.green, colors.greenSoft],
    ['swap', 'Swap available', colors.blue, colors.blueSoft],
    ['almost', '1-2 items needed', colors.amber, colors.amberSoft],
  ] as const)('colors the pill for %s', async (status, label, color, backgroundColor) => {
    await show({ ...almost, status });
    expect(styleOf(screen.getByText(label))).toMatchObject({ color, backgroundColor });
  });

  it('tints the tile for its status', async () => {
    await show(almost);
    expect(styleOf(tile()).backgroundColor).toBe(colors.amberSoft);
  });

  it('gives the tile a neutral tint without readiness', async () => {
    await show(null);
    expect(styleOf(tile()).backgroundColor).toBe(colors.divider);
  });
});

describe('RecipeCard with a bookmark button', () => {
  const card = () => recipeCards()[0];
  const saveButton = () => screen.getByRole('button', { name: 'Save Beef Tacos' });

  it('has no bookmark button unless given one', async () => {
    await render(<RecipeCard recipe={recipe} onPress={() => {}} />);
    expect(screen.queryByRole('button', { name: 'Save Beef Tacos' })).toBeNull();
  });

  it('shows the button beside the card, not inside it', async () => {
    await render(<RecipeCard recipe={recipe} onPress={() => {}} bookmark={{ saved: false, onToggle: () => {} }} />);
    expect(card()).not.toContainElement(saveButton());
  });

  it('shows a saved recipe as saved', async () => {
    await render(<RecipeCard recipe={recipe} onPress={() => {}} bookmark={{ saved: true, onToggle: () => {} }} />);
    expect(screen.getByRole('button', { name: 'Remove Beef Tacos from bookmarks' })).toBeOnTheScreen();
  });

  it('toggles the bookmark without opening the recipe', async () => {
    const onPress = jest.fn();
    const onToggle = jest.fn();
    await render(<RecipeCard recipe={recipe} onPress={onPress} bookmark={{ saved: false, onToggle }} />);
    await fireEvent.press(saveButton());
    expect([onToggle.mock.calls.length, onPress.mock.calls.length]).toEqual([1, 0]);
  });

  it('still opens the recipe from the card', async () => {
    const onPress = jest.fn();
    await render(<RecipeCard recipe={recipe} onPress={onPress} bookmark={{ saved: false, onToggle: () => {} }} />);
    await fireEvent.press(card());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('leaves the button out until it is known whether the recipe is saved', async () => {
    await render(<RecipeCard recipe={recipe} onPress={() => {}} bookmark={{ saved: null, onToggle: () => {} }} />);
    expect(screen.queryByRole('button', { name: 'Save Beef Tacos' })).toBeNull();
  });

  it("keeps the button's room while that isn't known, so the title doesn't jump", async () => {
    await render(<RecipeCard recipe={recipe} onPress={() => {}} bookmark={{ saved: null, onToggle: () => {} }} />);
    expect(styleOf(screen.getByText('Beef Tacos')).paddingRight).toBe(34);
  });

  it('keeps the recipe name clear of the button', async () => {
    await render(<RecipeCard recipe={recipe} onPress={() => {}} bookmark={{ saved: false, onToggle: () => {} }} />);
    expect(styleOf(screen.getByText('Beef Tacos')).paddingRight).toBe(34);
  });
});

describe('RecipeCard press feedback', () => {
  it('shrinks the card while a finger is on it', async () => {
    await render(<RecipeCard recipe={recipe} onPress={() => {}} />);
    expect(await scaleWhilePressed(screen.getByRole('button'))).toBeCloseTo(pressedScale('card', false), 3);
  });
});
