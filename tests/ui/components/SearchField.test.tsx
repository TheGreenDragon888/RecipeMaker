import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SearchField } from '../../../src/ui/components/SearchField';
import { colors } from '../../../src/ui/theme';
import { layoutBoxOf, styleOf } from '../../support/screen';

const props = { label: 'Search bookmarks', placeholder: 'Search your bookmarks…', clearLabel: 'Clear search', onChangeText: jest.fn() };
const field = () => screen.getByLabelText('Search bookmarks');

describe('SearchField', () => {
  it('shows its placeholder', async () => {
    await render(<SearchField {...props} value="" />);
    expect(field().props.placeholder).toBe('Search your bookmarks…');
  });

  it('reports what is typed', async () => {
    const onChangeText = jest.fn();
    await render(<SearchField {...props} value="" onChangeText={onChangeText} />);
    await fireEvent.changeText(field(), 'chili');
    expect(onChangeText).toHaveBeenCalledWith('chili');
  });

  it('has no clear button while empty', async () => {
    await render(<SearchField {...props} value="" />);
    expect(screen.queryByRole('button', { name: 'Clear search' })).toBeNull();
  });

  it('empties the field from its clear button', async () => {
    const onChangeText = jest.fn();
    await render(<SearchField {...props} value="chili" onChangeText={onChangeText} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Clear search' }));
    expect(onChangeText).toHaveBeenCalledWith('');
  });

  it('outlines the field in the accent color while focused', async () => {
    await render(<SearchField {...props} value="" />);
    await fireEvent(field(), 'focus');
    expect(styleOf(layoutBoxOf(field()).parent!).borderColor).toBe(colors.accent);
  });
});
