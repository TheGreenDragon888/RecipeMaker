import React from 'react';
import { act } from 'react-test-renderer';
import { SuggestionList } from '../../../src/ui/components/SuggestionList';
import { render, shownText } from '../../support/render';

describe('SuggestionList', () => {
  it('shows a button to add each suggestion', () => {
    const renderer = render(<SuggestionList suggestions={['tofu', 'tomato']} typed="to" onSelect={() => {}} />);
    expect(renderer.root.findByProps({ accessibilityLabel: 'Add tofu' })).toBeTruthy();
    expect(renderer.root.findByProps({ accessibilityLabel: 'Add tomato' })).toBeTruthy();
  });

  it('calls onSelect with the suggestion that was tapped', () => {
    const onSelect = jest.fn();
    const renderer = render(<SuggestionList suggestions={['tofu', 'tomato']} typed="to" onSelect={onSelect} />);
    act(() => renderer.root.findByProps({ accessibilityLabel: 'Add tomato' }).props.onPress());
    expect(onSelect).toHaveBeenCalledWith('tomato');
  });

  it('shows the typed part of a suggestion as its own piece of text', () => {
    const renderer = render(<SuggestionList suggestions={['tomato paste']} typed="tom" onSelect={() => {}} />);
    expect(shownText(renderer)).toEqual(expect.arrayContaining(['tom', 'ato paste']));
  });

  it('shows a suggestion that matched through an alias in one piece', () => {
    const renderer = render(<SuggestionList suggestions={['sesame oil']} typed="to" onSelect={() => {}} />);
    expect(shownText(renderer)).toContain('sesame oil');
  });
});
