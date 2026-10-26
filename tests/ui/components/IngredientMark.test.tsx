import React from 'react';
import { render } from '@testing-library/react-native';
import { IngredientMark } from '../../../src/ui/components/IngredientMark';
import { colors } from '../../../src/ui/theme';
import { iconDrawing, shownIcons, styleOf } from '../../support/screen';

describe('IngredientMark', () => {
  it.each([
    ['have', 'check', colors.green, colors.greenSoft],
    ['swap', 'swap', colors.blue, colors.blueSoft],
    ['notEnough', 'minus', colors.amber, colors.amberSoft],
    ['missing', 'close', colors.accent, colors.accentSoft],
  ] as const)('draws %s as the board does: a %s icon in its color on a soft circle', async (mark, icon, color, soft) => {
    await render(<IngredientMark mark={mark} />);
    expect(shownIcons()).toEqual([icon]);
    expect(iconDrawing(icon).props.stroke).toBe(color);
    expect(styleOf(iconDrawing(icon).parent!)).toMatchObject({ width: 22, height: 22, backgroundColor: soft });
  });
});
