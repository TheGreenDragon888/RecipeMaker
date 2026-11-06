import React from 'react';
import { AccessibilityInfo, BackHandler, DeviceEventEmitter, Keyboard, Text, View } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { BottomSheet } from '../../../src/ui/components/BottomSheet';
import { TRAY_SLIDE_MS } from '../../../src/ui/motion/trayDrag';
import { drag } from '../../support/drag';
import { styleOf } from '../../support/screen';

type SheetProps = React.ComponentProps<typeof BottomSheet>;
const element = (props: Partial<SheetProps> = {}) => (
  <BottomSheet open={false} bottomInset={34} closeLabel="Close without saving" onClose={() => {}} {...props}>
    {(dragHandlers) => (
      <View testID="sheet-drag-area" {...dragHandlers}>
        <Text>Sheet content</Text>
      </View>
    )}
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

  it("dims the whole screen, down to its bottom edge where the dock was", async () => {
    await render(element({ open: true }));
    expect(styleOf(screen.getByTestId('bottom-sheet-backdrop', everything))).toEqual(expect.objectContaining({ top: 0, bottom: 0 }));
  });

  it('stands on the bottom edge of the screen', async () => {
    await render(element({ open: true }));
    expect(styleOf(sheet()).bottom).toBe(0);
  });

  it('leaves room under its content for the home indicator or navigation bar', async () => {
    await render(element({ open: true }));
    expect(styleOf(sheet()).paddingBottom).toBe(34);
  });

  it('drops that room while it sits on the keyboard', async () => {
    await render(element({ open: true }));
    await act(async () => {
      DeviceEventEmitter.emit('keyboardWillShow', { endCoordinates: { height: 291, screenX: 0, screenY: 553, width: 390 }, duration: 250 });
    });
    expect(styleOf(sheet()).paddingBottom).toBe(0);
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

  it('rises to sit on the keyboard', async () => {
    await render(element({ open: true }));
    await act(async () => {
      DeviceEventEmitter.emit('keyboardWillShow', { endCoordinates: { height: 291, screenX: 0, screenY: 553, width: 390 }, duration: 250 });
    });
    await settle();
    expect(styleOf(sheet()).bottom).toBe(291);
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
    expect(styleOf(sheet()).bottom).toBe(0);
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

  describe('dragged down by its content', () => {
    /** The sheet measures 400 px tall, so a third of the way is 133 px. */
    const openMeasured = async (props: Partial<SheetProps> = {}) => {
      await render(element({ open: true, ...props }));
      await fireEvent(sheet(), 'layout', { nativeEvent: { layout: { x: 0, y: 444, width: 390, height: 400 } } });
    };
    const dragArea = () => screen.getByTestId('sheet-drag-area', everything);
    const backdropOpacity = () => styleOf(screen.getByTestId('bottom-sheet-backdrop', everything)).opacity as number;

    it('moves down with the finger', async () => {
      await openMeasured();
      drag(dragArea(), [40, 80, 120], { release: false });
      expect(translateY()).toBe(120);
    });

    it('fades the backdrop as it moves down', async () => {
      await openMeasured();
      drag(dragArea(), [100, 200], { release: false });
      expect(backdropOpacity()).toBeCloseTo(0.5, 5);
    });

    it('stays where it stands when dragged up', async () => {
      await openMeasured();
      drag(dragArea(), [-40, -80], { release: false });
      expect(translateY()).toBe(0);
    });

    it('closes the keyboard when a drag starts, since the sheet moves down past it', async () => {
      const dismiss = jest.spyOn(Keyboard, 'dismiss');
      await openMeasured();
      drag(dragArea(), [40, 80], { release: false });
      expect(dismiss).toHaveBeenCalled();
    });

    it('calls onClose when let go past a third of the way down', async () => {
      const onClose = jest.fn();
      await openMeasured({ onClose });
      drag(dragArea(), [100, 200, 200], { msPerStep: 50 });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose after a quick flick down, however short', async () => {
      const onClose = jest.fn();
      await openMeasured({ onClose });
      drag(dragArea(), [20, 60]);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('springs back after a short, slow drag down', async () => {
      const onClose = jest.fn();
      await openMeasured({ onClose });
      drag(dragArea(), [50, 100, 100], { msPerStep: 50 });
      // A spring takes longer to come to rest than a slide.
      await wait(1500);
      expect([onClose.mock.calls.length, translateY()]).toEqual([0, 0]);
    });

    it('slides the rest of the way off the screen once closed by a drag', async () => {
      await openMeasured();
      drag(dragArea(), [100, 200, 200], { msPerStep: 50 });
      await screen.rerender(element({ open: false }));
      await settle();
      expect(content()).toBeNull();
    });

    it('starts the next opening from its place, not where the last drag left it', async () => {
      await openMeasured();
      drag(dragArea(), [100, 200, 200], { msPerStep: 50 });
      await screen.rerender(element({ open: false }));
      await settle();
      await screen.rerender(element({ open: true }));
      await settle();
      expect(translateY()).toBe(0);
    });

    it('jumps back with Reduce Motion on', async () => {
      jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
      await openMeasured();
      drag(dragArea(), [50, 100, 100], { msPerStep: 50 });
      expect(translateY()).toBe(0);
    });
  });

  describe("making room for the dock", () => {
    // The board's dock: from 24 to 88 px up from the screen's bottom edge.
    const DOCK = { bottom: 24, top: 88 };
    const withDock = (props: Partial<SheetProps> = {}) => element({ dockSpot: DOCK, ...props });
    const lastReport = (reporter: jest.Mock) => reporter.mock.calls.at(-1)?.[0];

    it('says nothing while closed', async () => {
      const onCoversDockChange = jest.fn();
      await render(withDock({ onCoversDockChange }));
      expect(onCoversDockChange).not.toHaveBeenCalled();
    });

    it("says it covers the dock as soon as it slides up over the dock's spot", async () => {
      const onCoversDockChange = jest.fn();
      await render(withDock({ onCoversDockChange }));
      await screen.rerender(withDock({ open: true, onCoversDockChange }));
      await wait(50);
      expect(lastReport(onCoversDockChange)).toBe(true);
    });

    it('gives the dock its room back once it has slid down below it', async () => {
      const onCoversDockChange = jest.fn();
      await render(withDock({ open: true, onCoversDockChange }));
      await settle();
      await screen.rerender(withDock({ open: false, onCoversDockChange }));
      await settle();
      expect(lastReport(onCoversDockChange)).toBe(false);
    });

    it("gives the dock its room back while dragged down past the dock's spot", async () => {
      const onCoversDockChange = jest.fn();
      await render(withDock({ open: true, onCoversDockChange }));
      await fireEvent(sheet(), 'layout', { nativeEvent: { layout: { x: 0, y: 444, width: 390, height: 400 } } });
      drag(screen.getByTestId('sheet-drag-area', everything), [200, 390], { release: false });
      expect(lastReport(onCoversDockChange)).toBe(false);
    });

    it('covers the dock again when dragged back up over it', async () => {
      const onCoversDockChange = jest.fn();
      await render(withDock({ open: true, onCoversDockChange }));
      await fireEvent(sheet(), 'layout', { nativeEvent: { layout: { x: 0, y: 444, width: 390, height: 400 } } });
      drag(screen.getByTestId('sheet-drag-area', everything), [200, 390, 300], { release: false });
      expect(lastReport(onCoversDockChange)).toBe(true);
    });
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
