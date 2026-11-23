import React from 'react';
import { AccessibilityInfo } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { ToggleSwitch } from '../../../src/ui/components/ToggleSwitch';
import { colors } from '../../../src/ui/theme';
import { styleOf } from '../../support/screen';

const toggle = () => screen.getByRole('switch', { name: 'Meal Prep' });
const thumb = () => screen.getByTestId('toggle-thumb');
const track = () => screen.getByTestId('toggle-track');
const wait = (ms: number) => act(async () => { jest.advanceTimersByTime(ms); });

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockReturnValue(new Promise<boolean>(() => {}));
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('ToggleSwitch', () => {
  it('is a switch named by its label', async () => {
    await render(<ToggleSwitch label="Meal Prep" value={false} onValueChange={() => {}} />);
    expect(toggle()).toBeOnTheScreen();
  });

  it('reports that it is off', async () => {
    await render(<ToggleSwitch label="Meal Prep" value={false} onValueChange={() => {}} />);
    expect(toggle().props.accessibilityState).toEqual({ checked: false });
  });

  it('reports that it is on', async () => {
    await render(<ToggleSwitch label="Meal Prep" value onValueChange={() => {}} />);
    expect(toggle().props.accessibilityState).toEqual({ checked: true });
  });

  it('asks to switch on when tapped while off', async () => {
    const onValueChange = jest.fn();
    await render(<ToggleSwitch label="Meal Prep" value={false} onValueChange={onValueChange} />);
    await fireEvent.press(toggle());
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('asks to switch off when tapped while on', async () => {
    const onValueChange = jest.fn();
    await render(<ToggleSwitch label="Meal Prep" value onValueChange={onValueChange} />);
    await fireEvent.press(toggle());
    expect(onValueChange).toHaveBeenCalledWith(false);
  });

  it('draws a grey track when off and a blue one when on', async () => {
    await render(<ToggleSwitch label="Meal Prep" value={false} onValueChange={() => {}} />);
    const off = styleOf(track()).backgroundColor;
    await screen.rerender(<ToggleSwitch label="Meal Prep" value onValueChange={() => {}} />);
    expect([off, styleOf(track()).backgroundColor]).toEqual([colors.border, colors.blue]);
  });

  it('starts with its knob at the left when off', async () => {
    await render(<ToggleSwitch label="Meal Prep" value={false} onValueChange={() => {}} />);
    expect(styleOf(thumb()).left).toBe(3);
  });

  it('starts with its knob at the right when on', async () => {
    await render(<ToggleSwitch label="Meal Prep" value onValueChange={() => {}} />);
    expect(styleOf(thumb()).left).toBe(23);
  });

  it('slides its knob across when switched on', async () => {
    await render(<ToggleSwitch label="Meal Prep" value={false} onValueChange={() => {}} />);
    await screen.rerender(<ToggleSwitch label="Meal Prep" value onValueChange={() => {}} />);
    await wait(500);
    expect(styleOf(thumb()).left).toBe(23);
  });

  it('is at least 44 px tall, so a finger can hit it', async () => {
    await render(<ToggleSwitch label="Meal Prep" value={false} onValueChange={() => {}} />);
    expect(styleOf(toggle()).height).toBeGreaterThanOrEqual(44);
  });
});
