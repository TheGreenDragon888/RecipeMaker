// Test helpers for rendering React Native components with react-test-renderer.
import React from 'react';
import TestRenderer, { act, type ReactTestRenderer } from 'react-test-renderer';
import { Text } from 'react-native';

/** Renders an element synchronously (for components with no async work). */
export function render(element: React.ReactElement): ReactTestRenderer {
  let renderer!: ReactTestRenderer;
  act(() => { renderer = TestRenderer.create(element); });
  return renderer;
}

/** Every plain string shown inside a Text, including the pieces of nested Text. */
export function shownText(renderer: ReactTestRenderer): string[] {
  return renderer.root
    .findAllByType(Text)
    .flatMap((t) => [t.props.children].flat())
    .filter((child): child is string => typeof child === 'string');
}

/**
 * The native view drawn for a testID. An Animated.View wrapper has the same testID but still holds the
 * animated values in its style; the native view under it gets their current numbers.
 */
export function shownView(renderer: ReactTestRenderer, testID: string) {
  return renderer.root.find((node) => typeof node.type === 'string' && node.props.testID === testID);
}
