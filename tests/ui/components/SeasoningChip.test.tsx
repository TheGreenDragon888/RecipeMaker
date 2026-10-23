import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { SeasoningChip } from '../../../src/ui/components/SeasoningChip';
import { shownIcons, shownText, styleOf } from '../../support/screen';

type ChipProps = React.ComponentProps<typeof SeasoningChip>;

const renderChip = (props: Partial<ChipProps> = {}) =>
  render(<SeasoningChip label="Paprika" on={false} onToggle={() => {}} {...props} />);
const chip = () => screen.getByRole('togglebutton');

describe('SeasoningChip', () => {
  it('shows its label', async () => {
    await renderChip();
    expect(shownText()).toContain('Paprika');
  });

  it('calls onToggle when pressed', async () => {
    const onToggle = jest.fn();
    await renderChip({ onToggle });
    await fireEvent.press(chip());
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('tells screen readers it is on', async () => {
    await renderChip({ on: true });
    // RNTL's toBeChecked() doesn't accept the togglebutton role, so read the state screen readers get.
    expect(chip().props.accessibilityState).toEqual({ checked: true });
  });

  it('tells screen readers it is off', async () => {
    await renderChip({ on: false });
    expect(chip().props.accessibilityState).toEqual({ checked: false });
  });

  it('draws a check mark when on', async () => {
    await renderChip({ on: true });
    expect(shownIcons()).toEqual(['check']);
  });

  it('draws no check mark when off', async () => {
    await renderChip({ on: false });
    expect(shownIcons()).toEqual([]);
  });

  it('gives its touch area at least 44px of height', async () => {
    await renderChip();
    expect(styleOf(chip()).minHeight).toBeGreaterThanOrEqual(44);
  });
});
