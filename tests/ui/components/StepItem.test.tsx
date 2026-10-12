import React from 'react';
import { StepItem } from '../../../src/ui/components/StepItem';
import { render, shownText } from '../../support/render';

describe('StepItem', () => {
  it('shows the step number', () => {
    const renderer = render(<StepItem number={2} text="Brown the beef." />);
    expect(shownText(renderer)).toContain('2');
  });

  it('shows the step text', () => {
    const renderer = render(<StepItem number={2} text="Brown the beef." />);
    expect(shownText(renderer)).toContain('Brown the beef.');
  });
});
