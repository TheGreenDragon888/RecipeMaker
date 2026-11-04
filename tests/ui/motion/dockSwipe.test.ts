import { dockSlotAt, indicatorOffset, startsDockSwipe, swipeTarget } from '../../../src/ui/motion/dockSwipe';
import { dock } from '../../../src/ui/theme';

// Offsets are px from the first tab's left edge, inside the dock's padding.
describe('indicatorOffset', () => {
  it('puts the pill under the first tab at 0', () => {
    expect(indicatorOffset(0)).toBe(0);
  });

  it('puts the pill under the second tab one tab width along', () => {
    expect(indicatorOffset(1)).toBe(dock.itemWidth);
  });
});

describe('startsDockSwipe', () => {
  it('starts a swipe when the finger slides sideways more than a few pixels', () => {
    expect(startsDockSwipe(10, 0)).toBe(true);
  });

  it('starts a swipe to the left as well', () => {
    expect(startsDockSwipe(-10, 2)).toBe(true);
  });

  it('leaves a tap that barely moves to the tab under the finger', () => {
    expect(startsDockSwipe(4, 0)).toBe(false);
  });

  it('does not start a swipe for a mostly vertical movement', () => {
    expect(startsDockSwipe(10, -20)).toBe(false);
  });
});

// Points are px from the dock's top-left corner (its padding included). A dock of 3 tabs is
// 6 + 3 × 88 + 6 = 276 px wide and 6 + 52 + 6 = 64 px tall.
describe('dockSlotAt', () => {
  it('finds the first tab under the finger', () => {
    expect(dockSlotAt(50, 30, 3)).toBe(0);
  });

  it('finds the second tab under the finger', () => {
    expect(dockSlotAt(6 + 88 + 10, 30, 3)).toBe(1);
  });

  it('counts the padding before the first tab as the first tab', () => {
    expect(dockSlotAt(2, 30, 3)).toBe(0);
  });

  it('counts the padding after the last tab as the last tab', () => {
    expect(dockSlotAt(274, 30, 3)).toBe(2);
  });

  it('keeps the nearest tab while the finger is a little above the dock', () => {
    expect(dockSlotAt(50, -30, 3)).toBe(0);
  });

  it('keeps the nearest tab while the finger is a little past the end of the dock', () => {
    expect(dockSlotAt(276 + 30, 30, 3)).toBe(2);
  });

  it('finds no tab once the finger is well above the dock', () => {
    expect(dockSlotAt(50, -60, 3)).toBeNull();
  });

  it('finds no tab once the finger is well past the end of the dock', () => {
    expect(dockSlotAt(276 + 60, 30, 3)).toBeNull();
  });

  it('finds no tab once the finger is well before the start of the dock', () => {
    expect(dockSlotAt(-60, 30, 3)).toBeNull();
  });

  it('finds no tab once the finger is well below the dock', () => {
    expect(dockSlotAt(50, 64 + 60, 3)).toBeNull();
  });
});

describe('swipeTarget', () => {
  const tabs = [{ disabled: false }, { disabled: false }, { disabled: true }];

  it('opens the tab under the finger', () => {
    expect(swipeTarget(1, tabs)).toBe(1);
  });

  it('opens nothing over a disabled tab', () => {
    expect(swipeTarget(2, tabs)).toBeNull();
  });

  it('opens nothing when the finger is off the dock', () => {
    expect(swipeTarget(null, tabs)).toBeNull();
  });

  it('opens nothing over a tab that has not reported itself yet', () => {
    expect(swipeTarget(1, [{ disabled: false }])).toBeNull();
  });
});
