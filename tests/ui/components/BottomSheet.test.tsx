import React from 'react';
import { AccessibilityInfo, BackHandler, DeviceEventEmitter, Text } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { BottomSheet } from '../../../src/ui/components/BottomSheet';
import { TRAY_SLIDE_MS } from '../../../src/ui/motion/trayDrag';
import { styleOf } from '../../support/screen';

type SheetProps = React.ComponentProps<typeof BottomSheet>;
const element = (props: Partial<SheetProps> = {}) => (
  <BottomSheet open={false} bottom={100} bottomInset={34} closeLabel="Close without saving" onClose={() => {}} {...props}>
    <Text>Sheet content</Text>
  </BottomSheet>
);

const everything = { includeHiddenElements: true };
const content = () => screen.queryByText('Sheet content', everything);
const sheet = () => screen.getByTestId('bottom-sheet', everything);
const translateY = () => {
  const transform = styleOf(sheet()).transform as { translateY: number }[] | undefined;
  return transform?.[0]?.translateY;
};
const wait = (ms: number) => act(async () => { jest.advanceTimersByTime(ms); });
const settle = () => wait(1000);

beforeEach(() => {
  jest.useFakeTimers();
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockReturnValue(new Promise<boolean>(() => {}));
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('BottomSheet', () => {
  it('shows nothing while closed', async () => {
    await render(element());
    expect([content(), screen.queryByTestId('bottom-sheet', everything)]).toEqual([null, null]);
  });

  it('shows its content when open', async () => {
    await render(element({ open: true }));
    expect(content()).toBeOnTheScreen();
  });

  it('dims the screen down to its bottom edge, leaving the dock below it uncovered', async () => {
    await render(element({ open: true }));
    expect(styleOf(screen.getByTestId('bottom-sheet-backdrop', everything))).toEqual(expect.objectContaining({ top: 0, bottom: 100 }));
  });

  it('stands on the given bottom', async () => {
    await render(element({ open: true }));
    expect(styleOf(sheet()).bottom).toBe(100);
  });

  it('calls onClose from the backdrop, which is labelled for screen readers', async () => {
    const onClose = jest.fn();
    await render(element({ open: true, onClose }));
    await fireEvent.press(screen.getByRole('button', { name: 'Close without saving' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('slides up from below when it opens', async () => {
    await render(element());
    await screen.rerender(element({ open: true }));
    const start = translateY();
    await settle();
    expect([start! > 0, translateY()]).toEqual([true, 0]);
  });

  it('slides down and keeps its content until it is gone', async () => {
    await render(element({ open: true }));
    await settle();
    await screen.rerender(element({ open: false }));
    await wait(TRAY_SLIDE_MS / 2);
    const halfway = content();
    await settle();
    expect([halfway === null, content()]).toEqual([false, null]);
  });

  it('rises above the keyboard', async () => {
    await render(element({ open: true }));
    await act(async () => {
      DeviceEventEmitter.emit('keyboardWillShow', { endCoordinates: { height: 291, screenX: 0, screenY: 553, width: 390 }, duration: 250 });
    });
    await settle();
    expect(styleOf(sheet()).bottom).toBe(299);
  });

  it('goes back down when the keyboard closes', async () => {
    await render(element({ open: true }));
    await act(async () => {
      DeviceEventEmitter.emit('keyboardWillShow', { endCoordinates: { height: 291, screenX: 0, screenY: 553, width: 390 }, duration: 250 });
    });
    await settle();
    await act(async () => {
      DeviceEventEmitter.emit('keyboardWillHide', { endCoordinates: { height: 0, screenX: 0, screenY: 844, width: 390 }, duration: 250 });
    });
    await settle();
    expect(styleOf(sheet()).bottom).toBe(100);
  });

  it("closes on Android's back button", async () => {
    const handlers: Parameters<typeof BackHandler.addEventListener>[1][] = [];
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler) => {
      handlers.push(handler);
      return { remove: jest.fn() };
    });
    const onClose = jest.fn();
    await render(element({ open: true, onClose }));
    handlers[handlers.length - 1]({} as Parameters<(typeof handlers)[number]>[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  describe('with Reduce Motion on', () => {
    beforeEach(() => {
      jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    });

    it('opens without sliding', async () => {
      await render(element());
      await screen.rerender(element({ open: true }));
      expect(translateY()).toBe(0);
    });

    it('closes without sliding', async () => {
      await render(element({ open: true }));
      await screen.rerender(element({ open: false }));
      expect(content()).toBeNull();
    });
  });
});
