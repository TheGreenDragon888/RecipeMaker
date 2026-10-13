import React from 'react';
import { act } from 'react-test-renderer';
import { SourceCard } from '../../../src/ui/components/SourceCard';
import { render, shownText } from '../../support/render';
import { Icon } from '../../../src/ui/components/Icon';

const budgetBytes = { sourceSite: 'Budget Bytes', sourceUrl: 'https://www.budgetbytes.com/sloppy-joes/' };

describe('SourceCard', () => {
  it('names the site the recipe comes from', () => {
    const renderer = render(<SourceCard recipe={budgetBytes} onOpen={() => {}} />);
    expect(shownText(renderer)).toContain('Budget Bytes');
  });

  it('labels its link with the domain it opens', () => {
    const renderer = render(<SourceCard recipe={budgetBytes} onOpen={() => {}} />);
    expect(renderer.root.findByProps({ accessibilityRole: 'link' }).props.accessibilityLabel).toBe('View on budgetbytes.com');
  });

  it('calls onOpen when its link is pressed', () => {
    const onOpen = jest.fn();
    const renderer = render(<SourceCard recipe={budgetBytes} onOpen={onOpen} />);
    act(() => renderer.root.findByProps({ accessibilityRole: 'link' }).props.onPress());
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('says the link opens in the browser', () => {
    const renderer = render(<SourceCard recipe={budgetBytes} onOpen={() => {}} />);
    expect(shownText(renderer)).toContain('Opens in your browser.');
  });

  it('draws a link icon beside the site name', () => {
    const renderer = render(<SourceCard recipe={budgetBytes} onOpen={() => {}} />);
    expect(renderer.root.findAllByType(Icon).map((icon) => icon.props.name)).toContain('link');
  });

  it('draws an open-externally icon in its link', () => {
    const renderer = render(<SourceCard recipe={budgetBytes} onOpen={() => {}} />);
    const link = renderer.root.findByProps({ accessibilityRole: 'link' });
    expect(link.findByType(Icon).props.name).toBe('externalLink');
  });
});
