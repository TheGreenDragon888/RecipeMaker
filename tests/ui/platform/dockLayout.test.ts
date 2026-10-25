import { dockClearance, dockOffset, tabScreenClearance } from '../../../src/ui/platform/dockLayout';
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

describe('tabScreenClearance', () => {
  it('leaves room for the floating dock when the device shows the dock', () => {
    expect(tabScreenClearance({ tabBar: 'dock', bottomInset: 34 })).toBe(dockClearance(34));
  });

  it("leaves the board's dock gap above iOS's tab bar, which the bottom inset already covers", () => {
    // Inside an iOS tab, the inset is the 49 pt bar plus the 34 pt home indicator.
    expect(tabScreenClearance({ tabBar: 'native', bottomInset: 83 })).toBe(83 + dock.bottom);
  });
});
