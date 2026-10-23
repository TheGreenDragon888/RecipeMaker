import React from 'react';
import { StyleSheet } from 'react-native';
import { act } from 'react-test-renderer';
import { Icon } from '../../../src/ui/components/Icon';
import { SeasoningTrayHandle } from '../../../src/ui/components/SeasoningTrayHandle';
import { render, shownText } from '../../support/render';

const renderHandle = (onOpen = () => {}) => render(<SeasoningTrayHandle onCount={4} onOpen={onOpen} />);
const handle = (renderer: ReturnType<typeof render>) => renderer.root.findByProps({ accessibilityLabel: 'Open seasonings tray' });

describe('SeasoningTrayHandle', () => {
  it('names the tray', () => {
    expect(shownText(renderHandle())).toContain('Seasonings');
  });

  it('shows how many seasonings are on', () => {
    expect(shownText(renderHandle())).toContain('4 on hand');
  });

  it('calls onOpen when pressed', () => {
    const onOpen = jest.fn();
    const renderer = renderHandle(onOpen);
    act(() => handle(renderer).props.onPress());
    expect(onOpen).toHaveBeenCalledTimes(1);
  });

  it('is a button for screen readers', () => {
    expect(handle(renderHandle()).props.accessibilityRole).toBe('button');
  });

  it('draws only the spice jar, since its grab bar already says it pulls up', () => {
    expect(renderHandle().root.findAllByType(Icon).map((icon) => icon.props.name)).toEqual(['spiceJar']);
  });

  it('stretches to fill its space when asked to', () => {
    const renderer = render(<SeasoningTrayHandle onCount={4} onOpen={() => {}} fill />);
    expect(StyleSheet.flatten(handle(renderer).props.style).flex).toBe(1);
  });

  it('keeps to its own height otherwise', () => {
    expect(StyleSheet.flatten(handle(renderHandle()).props.style).flex).toBeUndefined();
  });

  it('is at least 44px tall', () => {
    expect(StyleSheet.flatten(handle(renderHandle()).props.style).minHeight).toBeGreaterThanOrEqual(44);
  });
});
