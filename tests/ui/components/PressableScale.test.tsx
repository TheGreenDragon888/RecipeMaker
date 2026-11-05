import React from 'react';
import { act } from 'react';
import { AccessibilityInfo, Text } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { PressableScale } from '../../../src/ui/components/PressableScale';
import { pressedScale, type PressSize } from '../../../src/ui/motion/pressFeedback';
import { pressIn, pressOut, scaleOf } from '../../support/screen';

const wait = (ms: number) => act(async () => { jest.advanceTimersByTime(ms); });
/** Long enough for any press spring to settle. */
const settle = () => wait(1500);
const button = () => screen.getByRole('button');
const element = (props: Partial<React.ComponentProps<typeof PressableScale>> = {}) => (
  <PressableScale size="button" accessibilityRole="button" {...props}>
    <Text>Find recipes</Text>
  </PressableScale>
);

beforeEach(() => {
  jest.useFakeTimers();
  // Unless a test says otherwise, the Reduce Motion setting never arrives, so it counts as off.
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockReturnValue(new Promise<boolean>(() => {}));
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('PressableScale', () => {
  it('shows what it is given', async () => {
    await render(element());
    expect(screen.getByText('Find recipes')).toBeOnTheScreen();
  });

  it('calls onPress when pressed', async () => {
    const onPress = jest.fn();
    await render(element({ onPress }));
    await fireEvent.press(button());
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('is full size before it is touched', async () => {
    await render(element());
    expect(scaleOf(button())).toBe(1);
  });

  it.each<PressSize>(['card', 'button', 'small'])('shrinks a %s to its pressed size while a finger is on it', async (size) => {
    await render(element({ size }));
    await pressIn(button());
    await settle();
    expect(scaleOf(button())).toBeCloseTo(pressedScale(size, false), 3);
  });

  it('shrinks smoothly rather than all at once', async () => {
    await render(element());
    await pressIn(button());
    await wait(16);
    expect(scaleOf(button())).toBeGreaterThan(pressedScale('button', false));
  });

  it('grows back to full size when the finger lifts', async () => {
    await render(element());
    await pressIn(button());
    await settle();
    await pressOut(button());
    await settle();
    expect(scaleOf(button())).toBeCloseTo(1, 3);
  });

  it('still calls its own onPressIn and onPressOut', async () => {
    const onPressIn = jest.fn();
    const onPressOut = jest.fn();
    await render(element({ onPressIn, onPressOut }));
    await pressIn(button());
    await pressOut(button());
    await settle();
    expect([onPressIn.mock.calls.length, onPressOut.mock.calls.length]).toEqual([1, 1]);
  });

  it('does not shrink when disabled', async () => {
    await render(element({ disabled: true }));
    await pressIn(button());
    await settle();
    expect(scaleOf(button())).toBe(1);
  });

  it('does not shrink with Reduce Motion on', async () => {
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    await render(element());
    await pressIn(button());
    await settle();
    expect(scaleOf(button())).toBe(1);
  });

  it('passes a style function the pressed state, as Pressable does', async () => {
    await render(element({ style: ({ pressed }) => ({ opacity: pressed ? 0.85 : 1 }) }));
    await pressIn(button());
    expect(button().props.style).toEqual({ opacity: 0.85 });
  });
});
