import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SourceCard } from '../../../src/ui/components/SourceCard';
import { shownIcons, shownText } from '../../support/screen';

const budgetBytes = { sourceSite: 'Budget Bytes', sourceUrl: 'https://www.budgetbytes.com/sloppy-joes/' };

describe('SourceCard', () => {
  it('names the site the recipe comes from', async () => {
    await render(<SourceCard recipe={budgetBytes} onOpen={() => {}} />);
    expect(shownText()).toContain('Budget Bytes');
  });

  it('labels its link with the domain it opens', async () => {
    await render(<SourceCard recipe={budgetBytes} onOpen={() => {}} />);
    expect(screen.getByRole('link')).toHaveAccessibleName('View on budgetbytes.com');
  });

  it('calls onOpen when its link is pressed', async () => {
    const onOpen = jest.fn();
    await render(<SourceCard recipe={budgetBytes} onOpen={onOpen} />);
    await fireEvent.press(screen.getByRole('link'));
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('says the link opens in the browser', async () => {
    await render(<SourceCard recipe={budgetBytes} onOpen={() => {}} />);
    expect(shownText()).toContain('Opens in your browser.');
  });

  it('draws a link icon beside the site name', async () => {
    await render(<SourceCard recipe={budgetBytes} onOpen={() => {}} />);
    expect(shownIcons()).toContain('link');
  });

  it('draws an open-externally icon in its link', async () => {
    await render(<SourceCard recipe={budgetBytes} onOpen={() => {}} />);
    expect(shownIcons(screen.getByRole('link'))).toEqual(['externalLink']);
  });
});
