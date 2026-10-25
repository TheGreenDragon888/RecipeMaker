import React from 'react';
import { AccessibilityInfo, BackHandler } from 'react-native';
import { act, fireEvent, render, screen } from '@testing-library/react-native';
import type { SeasoningGroup } from '../../../src/domain/seasonings';
import { SeasoningDrawer } from '../../../src/ui/components/SeasoningDrawer';
import { TRAY_SLIDE_MS } from '../../../src/ui/motion/trayDrag';
import { drag } from '../../support/drag';
import { fadesAsOnePicture, shownText, styleOf } from '../../support/screen';

const groups: SeasoningGroup[] = [{ section: 'everyday', seasonings: ['paprika', 'onion powder'] }];

// Distances are from the screen's bottom edge. The dock's clearance is 110 and the handle sits 172 up.
type DrawerProps = React.ComponentProps<typeof SeasoningDrawer>;
const element = (props: Partial<DrawerProps> = {}) => (
  <SeasoningDrawer
    groups={groups}
    on={['paprika']}
    bottom={110}
    handleBottom={172}
    open={false}
    onOpen={() => {}}
    onClose={() => {}}
    onToggle={() => {}}
    {...props}
  />
);

/** Closed, the sheet is the handle: 52 px tall, inset by the screen margin (20 px) on each side. */
const HANDLE_FRAME = { bottom: 172, height: 52, left: 20, right: 20 };
/** Open, it is the board's 520 px sheet, edge to edge, standing on the dock's clearance. */
const OPEN_FRAME = { bottom: 110, height: 520, left: 0, right: 0 };

// The handle and the tray can be on screen while see-through (fading), so these count them either way.
const everything = { includeHiddenElements: true };
const handles = () => screen.queryAllByLabelText('Open seasonings tray', everything);
const trays = () => screen.queryAllByTestId('seasoning-tray-drag-area', everything);
const view = (testID: string) => screen.getByTestId(testID, everything);
const frame = () => {
  const { bottom, height, left, right } = styleOf(view('seasoning-sheet'));
  return { bottom, height, left, right };
};
/** The sheet's top edge, the part that follows the finger. */
const topEdge = () => {
  const { bottom, height } = frame();
  return (bottom as number) + (height as number);
};
const wait = (ms: number) => act(async () => { jest.advanceTimersByTime(ms); });
/** Long enough for a slide or a spring to settle. */
const settle = () => wait(1500);

beforeEach(() => {
  jest.useFakeTimers();
  // Unless a test says otherwise, the Reduce Motion setting never arrives, so the drawer treats it as off
  // and never updates after the test ends.
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockReturnValue(new Promise<boolean>(() => {}));
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('SeasoningDrawer', () => {
  describe('closed', () => {
    it('shows the handle and no tray', async () => {
      await render(element());
      expect([handles().length, trays().length]).toEqual([1, 0]);
    });

    it('draws the sheet as the handle, above the find button', async () => {
      await render(element());
      expect(frame()).toEqual(HANDLE_FRAME);
    });

    it('shows on the handle how many seasonings are on', async () => {
      await render(element({ on: ['paprika', 'onion powder'] }));
      expect(shownText(handles()[0])).toContain('2 on hand');
    });

    it('calls onOpen when the handle is tapped', async () => {
      const onOpen = jest.fn();
      await render(element({ onOpen }));
      await fireEvent.press(handles()[0]);
      expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it('has no backdrop', async () => {
      await render(element());
      expect(screen.queryAllByTestId('seasoning-backdrop', everything)).toHaveLength(0);
    });
  });

  describe('open', () => {
    it('shows the tray in place of the handle', async () => {
      await render(element({ open: true }));
      expect([handles().length, trays().length]).toEqual([0, 1]);
    });

    it('draws the full sheet, edge to edge, above the dock', async () => {
      await render(element({ open: true }));
      expect(frame()).toEqual(OPEN_FRAME);
    });

    it('dims the screen above the dock', async () => {
      await render(element({ open: true }));
      expect(styleOf(view('seasoning-backdrop')).bottom).toBe(110);
    });

    it('calls onClose when the dimmed backdrop is tapped', async () => {
      const onClose = jest.fn();
      await render(element({ open: true, onClose }));
      await fireEvent.press(view('seasoning-backdrop-button'));
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('lets the tray switch seasonings and close', async () => {
      const onToggle = jest.fn();
      const onClose = jest.fn();
      await render(element({ open: true, onToggle, onClose }));
      await fireEvent.press(screen.getByRole('togglebutton', { name: 'Paprika' }));
      await fireEvent.press(screen.getByRole('button', { name: 'Done' }));
      expect([onToggle.mock.calls, onClose.mock.calls.length]).toEqual([[['paprika']], 1]);
    });

    it('is never taller than 85% of the screen', async () => {
      await render(element({ open: true }));
      await fireEvent(view('seasoning-tray-area'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 510 } } });
      expect(frame().height).toBe(433.5);
    });
  });

  describe('opening and closing with taps', () => {
    it('starts an opening sheet as the handle', async () => {
      await render(element());
      await screen.rerender(element({ open: true }));
      expect(frame()).toEqual(HANDLE_FRAME);
    });

    it('keeps the handle showing while the sheet starts to grow', async () => {
      await render(element());
      await screen.rerender(element({ open: true }));
      expect(handles()).toHaveLength(1);
    });

    it('covers the whole growing sheet with the handle, so nothing under it shows through', async () => {
      await render(element());
      await screen.rerender(element({ open: true }));
      const cover = styleOf(view('seasoning-handle-drag-area'));
      expect([cover.top, cover.bottom, cover.left, cover.right, styleOf(handles()[0]).flex]).toEqual([0, 0, 0, 0, 1]);
    });

    it('lays the seasonings out at full width while the sheet is narrower, so they never re-wrap', async () => {
      await render(element());
      await screen.rerender(element({ open: true }));
      const content = styleOf(view('seasoning-sheet-content'));
      expect([content.left, content.right, content.height]).toEqual([-20, -20, 520]);
    });

    it('grows an opening sheet into the full sheet', async () => {
      await render(element());
      await screen.rerender(element({ open: true }));
      await wait(TRAY_SLIDE_MS);
      expect(frame()).toEqual(OPEN_FRAME);
    });

    it('removes the handle once the sheet is open', async () => {
      await render(element());
      await screen.rerender(element({ open: true }));
      await wait(TRAY_SLIDE_MS);
      expect(handles()).toHaveLength(0);
    });

    it('keeps a closing tray on screen while it shrinks', async () => {
      await render(element({ open: true }));
      await screen.rerender(element({ open: false }));
      await wait(TRAY_SLIDE_MS / 2);
      expect(trays()).toHaveLength(1);
    });

    it('shrinks a closing sheet back into the handle', async () => {
      await render(element({ open: true }));
      await screen.rerender(element({ open: false }));
      await wait(TRAY_SLIDE_MS);
      expect(frame()).toEqual(HANDLE_FRAME);
    });

    it('leaves only the handle once the sheet has shrunk', async () => {
      await render(element({ open: true }));
      await screen.rerender(element({ open: false }));
      await wait(TRAY_SLIDE_MS);
      expect([handles().length, trays().length]).toEqual([1, 0]);
    });
  });

  describe('dragging the open tray down', () => {
    it('moves the top edge with the finger', async () => {
      await render(element({ open: true }));
      drag(view('seasoning-tray-drag-area'), [40, 80, 120], { release: false });
      expect(topEdge()).toBe(630 - 120);
    });

    it('calls onClose when let go past a third of the way to the handle', async () => {
      const onClose = jest.fn();
      await render(element({ open: true, onClose }));
      drag(view('seasoning-tray-drag-area'), [100, 200, 200], { msPerStep: 50 });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose after a quick flick down, however short', async () => {
      const onClose = jest.fn();
      await render(element({ open: true, onClose }));
      drag(view('seasoning-tray-drag-area'), [20, 60]);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('springs back open after a short, slow drag down', async () => {
      const onClose = jest.fn();
      await render(element({ open: true, onClose }));
      drag(view('seasoning-tray-drag-area'), [50, 100, 100], { msPerStep: 50 });
      await settle();
      expect([onClose.mock.calls.length, frame()]).toEqual([0, OPEN_FRAME]);
    });
  });

  describe('dragging the handle up', () => {
    it('grows the sheet out of the handle, its top edge with the finger', async () => {
      await render(element());
      drag(view('seasoning-handle-drag-area'), [-100, -200], { release: false });
      expect(topEdge()).toBe(172 + 52 + 200);
    });

    it('shows the tray while dragging', async () => {
      await render(element());
      drag(view('seasoning-handle-drag-area'), [-100, -200], { release: false });
      expect(trays()).toHaveLength(1);
    });

    // The backdrop fades too, but it is one flat color with nothing over it to overlap.
    it('fades the handle as one picture while dragging', async () => {
      await render(element());
      drag(view('seasoning-handle-drag-area'), [-10, -20], { release: false });
      expect(fadesAsOnePicture(view('seasoning-handle-drag-area'))).toBe(true);
    });

    it('calls onOpen when let go past a third of the way up', async () => {
      const onOpen = jest.fn();
      await render(element({ onOpen }));
      drag(view('seasoning-handle-drag-area'), [-100, -200, -200], { msPerStep: 50 });
      expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it('shrinks back into the handle after a short, slow drag up', async () => {
      const onOpen = jest.fn();
      await render(element({ onOpen }));
      drag(view('seasoning-handle-drag-area'), [-50, -100, -100], { msPerStep: 50 });
      await settle();
      expect([onOpen.mock.calls.length, trays().length, frame()]).toEqual([0, 0, HANDLE_FRAME]);
    });
  });

  describe('with Reduce Motion on', () => {
    beforeEach(() => {
      jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    });

    it('opens the tray without growing', async () => {
      await render(element());
      await screen.rerender(element({ open: true }));
      expect(frame()).toEqual(OPEN_FRAME);
    });

    it('closes the tray without shrinking', async () => {
      await render(element({ open: true }));
      await screen.rerender(element({ open: false }));
      expect(trays()).toHaveLength(0);
    });
  });

  describe("Android's back button", () => {
    /** The back-button handlers the drawer adds, newest last. */
    const backHandlers = () => {
      const handlers: Parameters<typeof BackHandler.addEventListener>[1][] = [];
      jest.spyOn(BackHandler, 'addEventListener').mockImplementation((_event, handler) => {
        handlers.push(handler);
        return { remove: jest.fn() };
      });
      return handlers;
    };

    it('closes the open tray', async () => {
      const handlers = backHandlers();
      const onClose = jest.fn();
      await render(element({ open: true, onClose }));
      handlers[handlers.length - 1]({} as Parameters<(typeof handlers)[number]>[0]);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('is left alone while the tray is closed', async () => {
      const handlers = backHandlers();
      await render(element({ open: false }));
      expect(handlers).toHaveLength(0);
    });
  });
});
