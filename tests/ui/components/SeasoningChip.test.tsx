import React from 'react';
import { StyleSheet } from 'react-native';
import { act } from 'react-test-renderer';
import { Icon } from '../../../src/ui/components/Icon';
import { SeasoningChip } from '../../../src/ui/components/SeasoningChip';
import { render, shownText } from '../../support/render';

type ChipProps = React.ComponentProps<typeof SeasoningChip>;

const renderChip = (props: Partial<ChipProps> = {}) =>
  render(<SeasoningChip label="Paprika" on={false} onToggle={() => {}} {...props} />);
const chip = (renderer: ReturnType<typeof render>) => renderer.root.findByProps({ accessibilityRole: 'togglebutton' });

describe('SeasoningChip', () => {
  it('shows its label', () => {
    expect(shownText(renderChip())).toContain('Paprika');
  });

  it('calls onToggle when pressed', () => {
    const onToggle = jest.fn();
    const renderer = renderChip({ onToggle });
    act(() => chip(renderer).props.onPress());
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('tells screen readers it is on', () => {
    expect(chip(renderChip({ on: true })).props.accessibilityState).toEqual({ checked: true });
  });

  it('tells screen readers it is off', () => {
    expect(chip(renderChip({ on: false })).props.accessibilityState).toEqual({ checked: false });
  });

  it('draws a check mark when on', () => {
    expect(renderChip({ on: true }).root.findByType(Icon).props.name).toBe('check');
  });

  it('draws no check mark when off', () => {
    expect(renderChip({ on: false }).root.findAllByType(Icon)).toHaveLength(0);
  });

  it('gives its touch area at least 44px of height', () => {
    expect(StyleSheet.flatten(chip(renderChip()).props.style).minHeight).toBeGreaterThanOrEqual(44);
  });
});
