import React from 'react';
import { AccessibilityInfo, StyleSheet } from 'react-native';
import TestRenderer, { act, type ReactTestRenderer } from 'react-test-renderer';
import type { SeasoningGroup } from '../../../src/domain/seasonings';
import { SeasoningDrawer } from '../../../src/ui/components/SeasoningDrawer';
import { SeasoningTray } from '../../../src/ui/components/SeasoningTray';
import { SeasoningTrayHandle } from '../../../src/ui/components/SeasoningTrayHandle';
import { TRAY_SLIDE_MS } from '../../../src/ui/motion/trayDrag';
import { drag } from '../../support/drag';
import { render, shownView } from '../../support/render';

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

const trays = (renderer: ReactTestRenderer) => renderer.root.findAllByType(SeasoningTray);
const handles = (renderer: ReactTestRenderer) => renderer.root.findAllByType(SeasoningTrayHandle);
const styleOf = (renderer: ReactTestRenderer, testID: string) => StyleSheet.flatten(shownView(renderer, testID).props.style);
const frame = (renderer: ReactTestRenderer) => {
  const { bottom, height, left, right } = styleOf(renderer, 'seasoning-sheet');
  return { bottom, height, left, right };
};
/** The sheet's top edge, the part that follows the finger. */
const topEdge = (renderer: ReactTestRenderer) => {
  const { bottom, height } = frame(renderer);
  return (bottom as number) + (height as number);
};
const trayDragArea = (renderer: ReactTestRenderer) => renderer.root.findByProps({ testID: 'seasoning-tray-drag-area' });
const handleDragArea = (renderer: ReactTestRenderer) => renderer.root.findByProps({ testID: 'seasoning-handle-drag-area' });
const wait = (ms: number) => act(() => { jest.advanceTimersByTime(ms); });
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
    it('shows the handle and no tray', () => {
      const renderer = render(element());
      expect([handles(renderer).length, trays(renderer).length]).toEqual([1, 0]);
    });

    it('draws the sheet as the handle, above the find button', () => {
      expect(frame(render(element()))).toEqual(HANDLE_FRAME);
    });

    it('passes the number of seasonings that are on to the handle', () => {
      const renderer = render(element({ on: ['paprika', 'onion powder'] }));
      expect(handles(renderer)[0].props.onCount).toBe(2);
    });

    it('calls onOpen when the handle is tapped', () => {
      const onOpen = jest.fn();
      const renderer = render(element({ onOpen }));
      act(() => handles(renderer)[0].props.onOpen());
      expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it('has no backdrop', () => {
      expect(render(element()).root.findAll((n) => n.props.testID === 'seasoning-backdrop')).toHaveLength(0);
    });
  });

  describe('open', () => {
    it('shows the tray in place of the handle', () => {
      const renderer = render(element({ open: true }));
      expect([handles(renderer).length, trays(renderer).length]).toEqual([0, 1]);
    });

    it('draws the full sheet, edge to edge, above the dock', () => {
      expect(frame(render(element({ open: true })))).toEqual(OPEN_FRAME);
    });

    it('dims the screen above the dock', () => {
      expect(styleOf(render(element({ open: true })), 'seasoning-backdrop').bottom).toBe(110);
    });

    it('calls onClose when the dimmed backdrop is tapped', () => {
      const onClose = jest.fn();
      const renderer = render(element({ open: true, onClose }));
      act(() => renderer.root.findByProps({ testID: 'seasoning-backdrop-button' }).props.onPress());
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('passes onToggle and onClose through to the tray', () => {
      const onToggle = jest.fn();
      const onClose = jest.fn();
      const renderer = render(element({ open: true, onToggle, onClose }));
      act(() => trays(renderer)[0].props.onToggle('paprika'));
      act(() => trays(renderer)[0].props.onClose());
      expect([onToggle.mock.calls, onClose.mock.calls.length]).toEqual([[['paprika']], 1]);
    });

    it('is never taller than 85% of the screen', () => {
      const renderer = render(element({ open: true }));
      act(() => shownView(renderer, 'seasoning-tray-area').props.onLayout({ nativeEvent: { layout: { x: 0, y: 0, width: 390, height: 510 } } }));
      expect(frame(renderer).height).toBe(433.5);
    });
  });

  describe('opening and closing with taps', () => {
    it('starts an opening sheet as the handle', () => {
      const renderer = render(element());
      act(() => renderer.update(element({ open: true })));
      expect(frame(renderer)).toEqual(HANDLE_FRAME);
    });

    it('keeps the handle showing while the sheet starts to grow', () => {
      const renderer = render(element());
      act(() => renderer.update(element({ open: true })));
      expect(handles(renderer)).toHaveLength(1);
    });

    it('covers the whole growing sheet with the handle, so nothing under it shows through', () => {
      const renderer = render(element());
      act(() => renderer.update(element({ open: true })));
      const cover = styleOf(renderer, 'seasoning-handle-drag-area');
      expect([cover.top, cover.bottom, cover.left, cover.right, handles(renderer)[0].props.fill]).toEqual([0, 0, 0, 0, true]);
    });

    it('lays the seasonings out at full width while the sheet is narrower, so they never re-wrap', () => {
      const renderer = render(element());
      act(() => renderer.update(element({ open: true })));
      const content = styleOf(renderer, 'seasoning-sheet-content');
      expect([content.left, content.right, content.height]).toEqual([-20, -20, 520]);
    });

    it('grows an opening sheet into the full sheet', () => {
      const renderer = render(element());
      act(() => renderer.update(element({ open: true })));
      wait(TRAY_SLIDE_MS);
      expect(frame(renderer)).toEqual(OPEN_FRAME);
    });

    it('removes the handle once the sheet is open', () => {
      const renderer = render(element());
      act(() => renderer.update(element({ open: true })));
      wait(TRAY_SLIDE_MS);
      expect(handles(renderer)).toHaveLength(0);
    });

    it('keeps a closing tray on screen while it shrinks', () => {
      const renderer = render(element({ open: true }));
      act(() => renderer.update(element({ open: false })));
      wait(TRAY_SLIDE_MS / 2);
      expect(trays(renderer)).toHaveLength(1);
    });

    it('shrinks a closing sheet back into the handle', () => {
      const renderer = render(element({ open: true }));
      act(() => renderer.update(element({ open: false })));
      wait(TRAY_SLIDE_MS);
      expect(frame(renderer)).toEqual(HANDLE_FRAME);
    });

    it('leaves only the handle once the sheet has shrunk', () => {
      const renderer = render(element({ open: true }));
      act(() => renderer.update(element({ open: false })));
      wait(TRAY_SLIDE_MS);
      expect([handles(renderer).length, trays(renderer).length]).toEqual([1, 0]);
    });
  });

  describe('dragging the open tray down', () => {
    it('moves the top edge with the finger', () => {
      const renderer = render(element({ open: true }));
      drag(trayDragArea(renderer), [40, 80, 120], { release: false });
      expect(topEdge(renderer)).toBe(630 - 120);
    });

    it('calls onClose when let go past a third of the way to the handle', () => {
      const onClose = jest.fn();
      const renderer = render(element({ open: true, onClose }));
      drag(trayDragArea(renderer), [100, 200, 200], { msPerStep: 50 });
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('calls onClose after a quick flick down, however short', () => {
      const onClose = jest.fn();
      const renderer = render(element({ open: true, onClose }));
      drag(trayDragArea(renderer), [20, 60]);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('springs back open after a short, slow drag down', () => {
      const onClose = jest.fn();
      const renderer = render(element({ open: true, onClose }));
      drag(trayDragArea(renderer), [50, 100, 100], { msPerStep: 50 });
      settle();
      expect([onClose.mock.calls.length, frame(renderer)]).toEqual([0, OPEN_FRAME]);
    });
  });

  describe('dragging the handle up', () => {
    it('grows the sheet out of the handle, its top edge with the finger', () => {
      const renderer = render(element());
      drag(handleDragArea(renderer), [-100, -200], { release: false });
      expect(topEdge(renderer)).toBe(172 + 52 + 200);
    });

    it('shows the tray while dragging', () => {
      const renderer = render(element());
      drag(handleDragArea(renderer), [-100, -200], { release: false });
      expect(trays(renderer)).toHaveLength(1);
    });

    it('calls onOpen when let go past a third of the way up', () => {
      const onOpen = jest.fn();
      const renderer = render(element({ onOpen }));
      drag(handleDragArea(renderer), [-100, -200, -200], { msPerStep: 50 });
      expect(onOpen).toHaveBeenCalledTimes(1);
    });

    it('shrinks back into the handle after a short, slow drag up', () => {
      const onOpen = jest.fn();
      const renderer = render(element({ onOpen }));
      drag(handleDragArea(renderer), [-50, -100, -100], { msPerStep: 50 });
      settle();
      expect([onOpen.mock.calls.length, trays(renderer).length, frame(renderer)]).toEqual([0, 0, HANDLE_FRAME]);
    });
  });

  describe('with Reduce Motion on', () => {
    beforeEach(() => {
      jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    });

    /** Renders and waits for the drawer to learn the Reduce Motion setting. */
    async function renderKnowingReduceMotion(drawer: React.ReactElement) {
      let renderer!: ReactTestRenderer;
      await act(async () => {
        renderer = TestRenderer.create(drawer);
      });
      return renderer;
    }

    it('opens the tray without growing', async () => {
      const renderer = await renderKnowingReduceMotion(element());
      act(() => renderer.update(element({ open: true })));
      expect(frame(renderer)).toEqual(OPEN_FRAME);
    });

    it('closes the tray without shrinking', async () => {
      const renderer = await renderKnowingReduceMotion(element({ open: true }));
      act(() => renderer.update(element({ open: false })));
      expect(trays(renderer)).toHaveLength(0);
    });
  });
});
