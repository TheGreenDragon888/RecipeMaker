import { dockClearance, dockHasRoom, dockHiddenDrop, dockOffset, dockSpot } from '../../../src/ui/platform/dockLayout';
import { dock } from '../../../src/ui/theme';

describe('dockOffset', () => {
  it("keeps the board's gap on a phone with no home indicator", () => {
    expect(dockOffset(0)).toBe(dock.bottom);
  });

  it('sits just above a home indicator taller than that gap', () => {
    expect(dockOffset(34)).toBe(34);
  });

  it("keeps the board's gap when the inset is smaller than it", () => {
    expect(dockOffset(10)).toBe(dock.bottom);
  });
});

describe('dockClearance', () => {
  it("is the board's clearance on a phone with no home indicator", () => {
    expect(dockClearance(0)).toBe(dock.clearance);
  });

  it('grows by as much as the dock is lifted', () => {
    expect(dockClearance(34)).toBe(dock.clearance + (34 - dock.bottom));
  });
});

describe('dockHiddenDrop', () => {
  const dockHeight = dock.itemHeight + 2 * dock.padding;

  it('moves the dock down past the bottom edge of the screen, shadow and all', () => {
    expect(dockHiddenDrop(dock.bottom)).toBeGreaterThan(dock.bottom + dockHeight);
  });

  it('drops a dock lifted above a home indicator by as much more', () => {
    expect(dockHiddenDrop(34) - dockHiddenDrop(dock.bottom)).toBe(34 - dock.bottom);
  });
});

describe('dockSpot', () => {
  it("is the dock's bottom and top edges, up from the screen's bottom edge", () => {
    expect(dockSpot(0)).toEqual({ bottom: dock.bottom, top: dock.bottom + dock.itemHeight + 2 * dock.padding });
  });

  it('sits above a home indicator taller than the board gap', () => {
    expect(dockSpot(34).bottom).toBe(34);
  });
});

describe('dockHasRoom', () => {
  // The board's dock: from 24 to 88 px up.
  const spot = { bottom: 24, top: 88 };

  it('has room once a sheet sits well above it', () => {
    expect(dockHasRoom({ sheetBottom: 100, sheetTop: 600, dock: spot, hadRoom: false })).toBe(true);
  });

  it('has no room while a sheet reaches down over it', () => {
    expect(dockHasRoom({ sheetBottom: 40, sheetTop: 600, dock: spot, hadRoom: true })).toBe(false);
  });

  it('has room once a sheet has slid down below it', () => {
    expect(dockHasRoom({ sheetBottom: -500, sheetTop: 10, dock: spot, hadRoom: false })).toBe(true);
  });

  it('waits for a little more than bare room before the dock comes back, so it never flickers', () => {
    expect(dockHasRoom({ sheetBottom: 90, sheetTop: 600, dock: spot, hadRoom: false })).toBe(false);
  });

  it('keeps the dock while a sheet only touches its edge', () => {
    expect(dockHasRoom({ sheetBottom: 88, sheetTop: 600, dock: spot, hadRoom: true })).toBe(true);
  });
});
