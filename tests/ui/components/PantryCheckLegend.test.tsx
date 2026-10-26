import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { PantryCheckLegend } from '../../../src/ui/components/PantryCheckLegend';
import { colors } from '../../../src/ui/theme';
import { shownIcons, shownText, styleOf } from '../../support/screen';

describe('PantryCheckLegend', () => {
  it('shows a chip for each circle given, in order, with its icon', async () => {
    await render(<PantryCheckLegend marks={['have', 'missing']} />);
    expect(shownText()).toEqual(['Have', 'Missing']);
    expect(shownIcons()).toEqual(['check', 'close']);
  });

  it('colors each chip like its circle', async () => {
    await render(<PantryCheckLegend marks={['notEnough']} />);
    expect(styleOf(screen.getByText('Not enough')).color).toBe(colors.amber);
    // The chip is the label's parent.
    expect(styleOf(screen.getByText('Not enough').parent!).backgroundColor).toBe(colors.amberSoft);
  });

  it('shows nothing when no circle is given', async () => {
    await render(<PantryCheckLegend marks={[]} />);
    expect(screen.toJSON()).toBeNull();
  });
});
