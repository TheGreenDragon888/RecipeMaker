import React from 'react';
import { act } from 'react-test-renderer';
import { SuggestionList } from '../../../src/ui/components/SuggestionList';
import { render, shownText } from '../../support/render';
import { StyleSheet } from 'react-native';
import { colors } from '../../../src/ui/theme';

describe('SuggestionList', () => {
  it('shows a button to add each suggestion', () => {
    const renderer = render(<SuggestionList suggestions={[{ ingredient: 'tofu', matchedAlias: null }, { ingredient: 'tomato', matchedAlias: null }]} typed="to" onSelect={() => {}} />);
    expect(renderer.root.findByProps({ accessibilityLabel: 'Add tofu' })).toBeTruthy();
    expect(renderer.root.findByProps({ accessibilityLabel: 'Add tomato' })).toBeTruthy();
  });

  it('calls onSelect with the suggestion that was tapped', () => {
    const onSelect = jest.fn();
    const renderer = render(<SuggestionList suggestions={[{ ingredient: 'tofu', matchedAlias: null }, { ingredient: 'tomato', matchedAlias: null }]} typed="to" onSelect={onSelect} />);
    act(() => renderer.root.findByProps({ accessibilityLabel: 'Add tomato' }).props.onPress());
    expect(onSelect).toHaveBeenCalledWith('tomato');
  });

  it('shows the typed part of a suggestion as its own piece of text', () => {
    const renderer = render(<SuggestionList suggestions={[{ ingredient: 'tomato paste', matchedAlias: null }]} typed="tom" onSelect={() => {}} />);
    expect(shownText(renderer)).toEqual(expect.arrayContaining(['tom', 'ato paste']));
  });

  it('shows a suggestion that matched through an alias in one piece', () => {
    const onSelect = jest.fn();
    const renderer = render(
      <SuggestionList
        suggestions={[{ ingredient: 'sesame oil', matchedAlias: 'toasted sesame oil' }]}
        typed="to"
        onSelect={onSelect}
      />,
    );
    const button = renderer.root.findByProps({ accessibilityLabel: 'Add sesame oil (toasted sesame oil)' });
    expect(shownText(renderer)).toContain('sesame oil (toasted sesame oil)');
    act(() => button.props.onPress());
    expect(onSelect).toHaveBeenCalledWith('sesame oil');
  });
});
