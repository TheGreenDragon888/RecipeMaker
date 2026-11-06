import { dockClearance, dockHiddenDrop, dockOffset } from '../../../src/ui/platform/dockLayout';
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
