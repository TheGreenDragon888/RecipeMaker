import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { FilterNoMatches } from '../../../src/ui/components/FilterNoMatches';
import { fonts } from '../../../src/ui/theme';
import { shownIcons, styleOf } from '../../support/screen';

describe('FilterNoMatches', () => {
  it('says no recipes match the filters', async () => {
    await render(<FilterNoMatches parts={['15 min hands-on']} />);
    expect(screen.getByText('No recipes match your filters')).toBeOnTheScreen();
  });

  it('names the filters that leave nothing, together', async () => {
    await render(<FilterNoMatches parts={['15 min hands-on', 'Meal Prep']} />);
    expect(screen.getByText('No recipe fits 15 min hands-on and Meal Prep together.')).toBeOnTheScreen();
  });

  it('draws each filter it names in bold', async () => {
    await render(<FilterNoMatches parts={['15 min hands-on', 'Meal Prep']} />);
    expect([screen.getByText('15 min hands-on'), screen.getByText('Meal Prep')].map((text) => styleOf(text).fontFamily)).toEqual([
      fonts.heavy,
      fonts.heavy,
    ]);
  });

  it('suggests loosening one of them', async () => {
    await render(<FilterNoMatches parts={['Meal Prep']} />);
    expect(screen.getByText('Open Filters to loosen one of them.')).toBeOnTheScreen();
  });

  it('draws the crossed magnifier', async () => {
    await render(<FilterNoMatches parts={['Meal Prep']} />);
    expect(shownIcons()).toEqual(['searchOff']);
  });
});
