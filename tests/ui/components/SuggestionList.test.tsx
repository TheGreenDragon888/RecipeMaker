import React from 'react';
import { act } from 'react-test-renderer';
import { SuggestionList } from '../../../src/ui/components/SuggestionList';
import { render, shownText } from '../../support/render';
import { StyleSheet } from 'react-native';
import { colors } from '../../../src/ui/theme';

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

  it('shows the typed part of a capitalized suggestion as its own piece of text', () => {
    const renderer = render(<SuggestionList suggestions={['tomato paste']} typed="tom" onSelect={() => {}} />);
    expect(shownText(renderer)).toEqual(expect.arrayContaining(['Tom', 'ato Paste']));
  });

  it('shows a suggestion that matched through an alias in one capitalized piece', () => {
    const renderer = render(<SuggestionList suggestions={['sesame oil']} typed="to" onSelect={() => {}} />);
    expect(shownText(renderer)).toContain('Sesame Oil');
  });

  it('shows "+ Add" on every suggestion', () => {
    const renderer = render(<SuggestionList suggestions={['tofu', 'tomato']} typed="to" onSelect={() => {}} />);
    expect(shownText(renderer).filter((text) => text === '+ Add')).toHaveLength(2);
  });

  it('highlights the first suggestion before anything is pressed', () => {
    const renderer = render(<SuggestionList suggestions={['tofu', 'tomato']} typed="to" onSelect={() => {}} />);
    const rowStyle = (label: string) =>
      StyleSheet.flatten(renderer.root.findByProps({ accessibilityLabel: label }).props.style({ pressed: false }));
    expect(rowStyle('Add tofu').backgroundColor).toBe(colors.pressed);
    expect(rowStyle('Add tomato').backgroundColor).toBeUndefined();
  });

  it('still changes the highlighted first row while it is pressed', () => {
    const renderer = render(<SuggestionList suggestions={['tofu', 'tomato']} typed="to" onSelect={() => {}} />);
    const style = renderer.root.findByProps({ accessibilityLabel: 'Add tofu' }).props.style;
    expect(StyleSheet.flatten(style({ pressed: true }))).not.toEqual(StyleSheet.flatten(style({ pressed: false })));
  });
});
