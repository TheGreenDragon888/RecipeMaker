// Test helpers on top of React Native Testing Library's `screen`, for what its queries don't cover directly.
// Queries see only native ("host") views, such as View, Text and the SVG shapes, not our own components.
import { act } from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, screen } from '@testing-library/react-native';
import type { TestInstance } from 'test-renderer';

/** Every plain string shown inside a Text (on screen, or inside one element), including nested pieces, in order. */
export function shownText(inside?: TestInstance): string[] {
  return (inside ?? screen.container)
    .queryAll((node) => node.type === 'Text')
    .flatMap((node) => node.children.filter((child): child is string => typeof child === 'string'));
}

/** The flattened style of a native view. */
export function styleOf(element: TestInstance) {
  return StyleSheet.flatten(element.props.style) ?? {};
}

/** The native views drawn see-through right now (opacity below 1), in screen order. */
export function fadedViews(): TestInstance[] {
  return screen.container.queryAll((node) => typeof node.type === 'string' && (styleOf(node).opacity ?? 1) < 1);
}

/**
 * Whether a native view fades as one picture on Android (needsOffscreenAlphaCompositing). Without it, Android fades
 * each piece of the view on its own, and a darker patch shows where pieces overlap (a button's fill under its label).
 */
export function fadesAsOnePicture(element: TestInstance): boolean {
  return element.props.needsOffscreenAlphaCompositing === true;
}

/** Every native view of a type (e.g. 'RNSVGPath' for an icon's lines), in screen order. */
export function shownOfType(type: string): TestInstance[] {
  return screen.container.queryAll((node) => node.type === type);
}

/** The touch event a finger sends to a button (React Native's responder events). */
const touchEvent = () => ({
  nativeEvent: { timestamp: 0, pageX: 0, pageY: 0, locationX: 0, locationY: 0, touches: [], changedTouches: [] },
  persist() {},
  currentTarget: { measure() {} },
});

/**
 * Puts a finger down on a button and keeps it there, so it shows its pressed look. This sends the touch-start
 * event a real finger does, which React Native's Pressable answers by switching to `pressed`.
 */
export async function pressIn(element: TestInstance) {
  await fireEvent(element, 'responderGrant', touchEvent());
}

/** Lifts the finger put down by pressIn, as React Native's touch-end event. */
export async function pressOut(element: TestInstance) {
  await fireEvent(element, 'responderRelease', touchEvent());
}

/**
 * How much a view is scaled right now: its own `scale` transform, or that of the nearest view around it that
 * has one (PressableScale scales a wrapper around its button). 1 when nothing around it is scaled.
 */
export function scaleOf(element: TestInstance): number {
  for (let node: TestInstance | null = element; node; node = node.parent) {
    const transform = typeof node.type === 'string' ? (styleOf(node).transform as Record<string, number>[] | undefined) : undefined;
    const scale = transform?.find((step) => 'scale' in step)?.scale;
    if (scale !== undefined) return scale;
  }
  return 1;
}

/**
 * The box a button takes up in its parent's layout: the wrapper PressableScale scales, when it has one, else the
 * button itself. Use it to walk from a button to the views around it.
 */
export function layoutBoxOf(element: TestInstance): TestInstance {
  const parent = element.parent;
  if (!parent || typeof parent.type !== 'string') return element;
  const transform = styleOf(parent).transform as Record<string, number>[] | undefined;
  return transform?.some((step) => 'scale' in step) ? parent : element;
}

/**
 * How much a button is scaled once a finger has been on it long enough for the press to settle. Uses Jest's
 * fake timers for the press spring and puts the real ones back, so call it only where a test uses real timers.
 */
export async function scaleWhilePressed(element: TestInstance): Promise<number> {
  jest.useFakeTimers();
  try {
    await pressIn(element);
    await act(async () => {
      jest.advanceTimersByTime(1500);
    });
    return scaleOf(element);
  } finally {
    jest.useRealTimers();
  }
}

/**
 * Taps a button twice before the screen redraws, as two very fast taps can. Each tap is the touch-start and
 * touch-end a finger sends; both run inside one React update, so the second tap still sees the first render.
 */
export function tapTwiceBeforeRedraw(element: TestInstance) {
  const tap = () => {
    element.props.onResponderGrant(touchEvent());
    element.props.onResponderRelease(touchEvent());
  };
  act(() => {
    tap();
    tap();
  });
}

/** Whether a loading spinner (React Native's ActivityIndicator) is on screen. */
export function isLoading(): boolean {
  return shownOfType('ActivityIndicator').length > 0;
}

/** The recipe cards on screen, in order: the buttons with no label of their own (screen readers read their text). */
export function recipeCards(): TestInstance[] {
  return screen.queryAllByRole('button').filter((button) => !button.props.accessibilityLabel);
}

/** The recipe names on the cards on screen, in order (each card's first line). */
export function recipeCardNames(): string[] {
  return recipeCards().map((card) => shownText(card)[0]);
}

/** How far ahead a FlatList builds rows: the window settings it passes down to its scroll view. */
export function listWindow() {
  const { windowSize, initialNumToRender, maxToRenderPerBatch } = shownOfType('RCTScrollView')[0].props;
  return { windowSize, initialNumToRender, maxToRenderPerBatch };
}

/** The scrolling list's content style (a ScrollView or FlatList's contentContainerStyle). */
export function listContentStyle() {
  return StyleSheet.flatten(shownOfType('RCTScrollView')[0].props.contentContainerStyle) ?? {};
}

/** The drawing of the one icon with this name on screen (its `stroke` is the icon's color). */
export function iconDrawing(name: string): TestInstance {
  return screen.getByTestId(`icon-${name}`, { includeHiddenElements: true });
}

/** The names of the icons drawn on screen, or inside one element, in order (see Icon's testID). */
export function shownIcons(inside?: TestInstance): string[] {
  return (inside ?? screen.container)
    .queryAll((node) => typeof node.props.testID === 'string' && node.props.testID.startsWith('icon-'))
    .map((node) => String(node.props.testID).slice('icon-'.length));
}
