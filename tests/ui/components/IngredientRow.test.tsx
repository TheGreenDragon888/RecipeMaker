import React from 'react';
import { render, screen } from '@testing-library/react-native';
import type { TestInstance } from 'test-renderer';
import type { PantryCheck } from '../../../src/domain/pantryCheck';
import { IngredientRow } from '../../../src/ui/components/IngredientRow';
import { colors, fonts } from '../../../src/ui/theme';
import { shownIcons, shownText, styleOf } from '../../support/screen';

const LINE = '3 cloves garlic, minced';
const haveSix: PantryCheck = { status: 'have', have: { amount: 6, unit: 'clove', approximate: false } };
const missing: PantryCheck = { status: 'missing' };
const tamari: PantryCheck = { status: 'swap', substitute: 'tamari', have: null };

const rowFor = (check?: PantryCheck, divider = false) => render(<IngredientRow text={LINE} check={check} divider={divider} />);
/** The row, found as screen readers find it: the line and its check read as one. */
const row = (label: string) => screen.getByLabelText(`${LINE}. ${label}`);
const textStyle = (text: string) => styleOf(screen.getByText(text));

describe('IngredientRow', () => {
  it('shows the line', async () => {
    await rowFor();
    expect(shownText()).toEqual([LINE]);
  });

  it('draws no circle when there is no pantry to compare with', async () => {
    await rowFor();
    expect(shownIcons()).toEqual([]);
  });

  it('draws the circle for its check', async () => {
    await rowFor(missing);
    expect(shownIcons()).toEqual(['close']);
  });

  it('shows how much is on hand beside the line', async () => {
    await rowFor(haveSix);
    expect(shownText()).toEqual([LINE, 'have 6 cloves']);
  });

  it('shows what is wrong under a line that is missing', async () => {
    await rowFor(missing);
    expect(shownText()).toEqual([LINE, 'Not in your pantry']);
  });

  it('writes a missing line\'s text in bold, in the circle\'s color', async () => {
    await rowFor(missing);
    expect(textStyle('Not in your pantry')).toMatchObject({ color: colors.accent, fontFamily: fonts.bold });
  });

  it('writes a swap in regular weight, as the board does', async () => {
    await rowFor(tamari);
    expect(textStyle('Swap: use tamari')).toMatchObject({ color: colors.blue, fontFamily: fonts.regular });
  });

  it.each([
    ['missing', missing, colors.accentWash, 'Not in your pantry'],
    ['a swap', tamari, colors.blueWash, 'Swap: use tamari'],
  ] as const)('tints the row of %s', async (_, check, wash, label) => {
    await rowFor(check);
    expect(styleOf(row(label)).backgroundColor).toBe(wash);
  });

  it('leaves the row of an ingredient on hand untinted', async () => {
    await rowFor(haveSix);
    expect(styleOf(row('In your pantry, have 6 cloves')).backgroundColor).toBeUndefined();
  });

  it('tells screen readers the line and its check together', async () => {
    await rowFor(missing);
    expect(row('Not in your pantry')).toBeTruthy();
  });

  it('leaves room for the circle on an optional line it has none for, so its text lines up with the rest', async () => {
    await rowFor({ status: 'optional' });
    const [space] = row('Not in your pantry').children;
    expect(shownIcons()).toEqual([]);
    expect(styleOf(space as TestInstance)).toMatchObject({ width: 22 });
  });

  it('draws a divider under it when asked', async () => {
    await rowFor(haveSix, true);
    expect(styleOf(row('In your pantry, have 6 cloves')).borderBottomWidth).toBe(1);
  });

  it('draws no divider under the last row', async () => {
    await rowFor(haveSix, false);
    expect(styleOf(row('In your pantry, have 6 cloves')).borderBottomWidth).toBeUndefined();
  });
});
