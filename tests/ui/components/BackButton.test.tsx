import React from 'react';
import { act, type ReactTestRenderer } from 'react-test-renderer';
import { BackButton } from '../../../src/ui/components/BackButton';
import { render } from '../../support/render';
import { Icon } from '../../../src/ui/components/Icon';
import { StyleSheet } from 'react-native';
import { colors } from '../../../src/ui/theme';

const button = (renderer: ReactTestRenderer) => renderer.root.findByProps({ accessibilityRole: 'button' });

describe('BackButton', () => {
  it('is announced by its label', () => {
    const renderer = render(<BackButton label="Back to pantry" onPress={() => {}} />);
    expect(button(renderer).props.accessibilityLabel).toBe('Back to pantry');
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const renderer = render(<BackButton label="Back to pantry" onPress={onPress} />);
    act(() => button(renderer).props.onPress());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('draws a chevron icon', () => {
    const renderer = render(<BackButton label="Back to pantry" onPress={() => {}} />);
    expect(renderer.root.findByType(Icon).props.name).toBe('chevronLeft');
  });

  it('has an outline by default', () => {
    const renderer = render(<BackButton label="Back to pantry" onPress={() => {}} />);
    expect(StyleSheet.flatten(button(renderer).props.style({ pressed: false })).borderWidth).toBe(1);
  });

  it('has no outline and a see-through fill over the recipe banner', () => {
    const renderer = render(<BackButton label="Back to recipes" onPress={() => {}} overBanner />);
    const style = StyleSheet.flatten(button(renderer).props.style({ pressed: false }));
    expect([style.borderWidth ?? 0, style.backgroundColor]).toEqual([0, colors.surfaceTranslucent]);
  });
});
