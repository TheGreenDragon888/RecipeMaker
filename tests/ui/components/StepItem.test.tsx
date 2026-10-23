import React from 'react';
import { render } from '@testing-library/react-native';
import { StepItem } from '../../../src/ui/components/StepItem';
import { shownText } from '../../support/screen';

describe('StepItem', () => {
  it('shows the step number', async () => {
    await render(<StepItem number={2} text="Brown the beef." />);
    expect(shownText()).toContain('2');
  });

  it('shows the step text', async () => {
    await render(<StepItem number={2} text="Brown the beef." />);
    expect(shownText()).toContain('Brown the beef.');
  });
});
