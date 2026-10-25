import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SuggestionList } from '../../../src/ui/components/SuggestionList';
import { colors } from '../../../src/ui/theme';
import { fadedViews, fadesAsOnePicture, pressIn, shownText, styleOf } from '../../support/screen';

const suggestion = (ingredient: string, matchedAlias: string | null = null) => ({ ingredient, matchedAlias });

describe('SuggestionList', () => {
  it('shows a button to add each suggestion', async () => {
    await render(<SuggestionList suggestions={[suggestion('tofu'), suggestion('tomato')]} typed="to" onSelect={() => {}} />);
    expect(screen.getByLabelText('Add tofu')).toBeOnTheScreen();
    expect(screen.getByLabelText('Add tomato')).toBeOnTheScreen();
  });

  it('calls onSelect with the suggestion that was tapped', async () => {
    const onSelect = jest.fn();
    await render(<SuggestionList suggestions={[suggestion('tofu'), suggestion('tomato')]} typed="to" onSelect={onSelect} />);
    await fireEvent.press(screen.getByLabelText('Add tomato'));
    expect(onSelect).toHaveBeenCalledWith('tomato');
  });

  it('shows the typed part of a capitalized suggestion as its own piece of text', async () => {
    await render(<SuggestionList suggestions={[suggestion('tomato paste')]} typed="tom" onSelect={() => {}} />);
    expect(shownText()).toEqual(expect.arrayContaining(['Tom', 'ato Paste']));
  });

  it('shows a suggestion that matched through an alias in one capitalized piece', async () => {
    const onSelect = jest.fn();
    await render(
      <SuggestionList
        suggestions={[suggestion('sesame oil', 'toasted sesame oil')]}
        typed="to"
        onSelect={onSelect}
      />,
    );
    expect(shownText()).toContain('Sesame Oil (Toasted Sesame Oil)');
    await fireEvent.press(screen.getByLabelText('Add sesame oil (toasted sesame oil)'));
    expect(onSelect).toHaveBeenCalledWith('sesame oil');
  });

  it('fades a pressed row as one picture', async () => {
    await render(<SuggestionList suggestions={[suggestion('tofu'), suggestion('tomato')]} typed="to" onSelect={() => {}} />);
    await pressIn(screen.getByLabelText('Add tomato'));
    expect(fadedViews().map(fadesAsOnePicture)).toEqual([true]);
  });

  it('shows "+ Add" on every suggestion', async () => {
    await render(<SuggestionList suggestions={[suggestion('tofu'), suggestion('tomato')]} typed="to" onSelect={() => {}} />);
    expect(shownText().filter((text) => text === '+ Add')).toHaveLength(2);
  });

  it('highlights the first suggestion before anything is pressed', async () => {
    await render(<SuggestionList suggestions={[suggestion('tofu'), suggestion('tomato')]} typed="to" onSelect={() => {}} />);
    expect(styleOf(screen.getByLabelText('Add tofu')).backgroundColor).toBe(colors.pressed);
    expect(styleOf(screen.getByLabelText('Add tomato')).backgroundColor).toBeUndefined();
  });

  it('still changes the highlighted first row while it is pressed', async () => {
    await render(<SuggestionList suggestions={[suggestion('tofu'), suggestion('tomato')]} typed="to" onSelect={() => {}} />);
    const before = styleOf(screen.getByLabelText('Add tofu'));
    await pressIn(screen.getByLabelText('Add tofu'));
    expect(styleOf(screen.getByLabelText('Add tofu'))).not.toEqual(before);
  });
});
