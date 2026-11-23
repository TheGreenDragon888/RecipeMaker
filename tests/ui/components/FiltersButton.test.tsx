import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { FiltersButton } from '../../../src/ui/components/FiltersButton';
import { colors } from '../../../src/ui/theme';
import { shownIcons, shownText, styleOf } from '../../support/screen';

const button = () => screen.getByRole('button');

describe('FiltersButton', () => {
  it('says Filters', async () => {
    await render(<FiltersButton activeCount={0} onPress={() => {}} />);
    expect(shownText()).toEqual(['Filters']);
  });

  it('draws the sliders icon', async () => {
    await render(<FiltersButton activeCount={0} onPress={() => {}} />);
    expect(shownIcons(button())).toEqual(['filters']);
  });

  it('is named Filters when nothing is selected', async () => {
    await render(<FiltersButton activeCount={0} onPress={() => {}} />);
    expect(button()).toHaveAccessibleName('Filters');
  });

  it('is plain when nothing is selected', async () => {
    await render(<FiltersButton activeCount={0} onPress={() => {}} />);
    expect([styleOf(button()).backgroundColor, styleOf(button()).borderColor]).toEqual([colors.surface, colors.border]);
  });

  it('shows how many filters are selected', async () => {
    await render(<FiltersButton activeCount={2} onPress={() => {}} />);
    expect(shownText()).toEqual(['Filters', '2']);
  });

  it('tells screen readers how many are selected', async () => {
    await render(<FiltersButton activeCount={2} onPress={() => {}} />);
    expect(button()).toHaveAccessibleName('Filters, 2 active');
  });

  it('turns blue when something is selected', async () => {
    await render(<FiltersButton activeCount={1} onPress={() => {}} />);
    expect([styleOf(button()).backgroundColor, styleOf(button()).borderColor]).toEqual([colors.blueWash, colors.blue]);
  });

  it('calls onPress when tapped', async () => {
    const onPress = jest.fn();
    await render(<FiltersButton activeCount={0} onPress={onPress} />);
    await fireEvent.press(button());
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
